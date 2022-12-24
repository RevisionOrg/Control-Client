import { DataStoreService, HttpService, MessagingService, Players } from "@rbxts/services";
import { Options } from "server";

export const bannedPlayersDataStore = DataStoreService.GetDataStore("BannedPlayers");

export interface Message {
	[key: string]: unknown;
}

interface ChatSpeaker {
	SendSystemMessage(message: string, channel: string): void;
}

interface ChatService {
	GetSpeakerList(): Array<ChatSpeaker>;
}

export const ChatService = require(game
	.GetService("ServerScriptService")
	.WaitForChild("ChatServiceRunner")
	.WaitForChild("ChatService") as ModuleScript) as ChatService;

export default class ControlMessagingService {
	private static instance: ControlMessagingService;
	private static messageingServiceTopics = [
		{
			topic: "Annoucement",
			isPrivate: false,
			callback: (data: unknown) => {
				this.announceMessage(data as string);
			},
		},
		{
			topic: "KickPlayer",
			isPrivate: true,
			callback: (data: unknown) => {
				const { userId, reason } = HttpService.JSONDecode((data as Message)["Data"] as string) as {
					userId: string;
					reason: string;
				};
				const player = Players.GetPlayerByUserId(tonumber(userId) as number);

				if (userId === undefined || reason === undefined || player === undefined) return;

				this.kickPlayer(player, reason);
			},
		},
		{
			topic: "BanPlayer",
			isPrivate: true,
			callback: (data: unknown) => {
				const { userId, reason } = HttpService.JSONDecode((data as Message)["Data"] as string) as {
					userId: string;
					reason: string;
				};
				const player = Players.GetPlayerByUserId(tonumber(userId) as number);

				if (userId === undefined || reason === undefined || player === undefined) return;

				this.banPlayer(player, reason);
			},
		},
	];

	public static getInstance() {
		if (!ControlMessagingService.instance) {
			ControlMessagingService.instance = new ControlMessagingService();
		}

		return ControlMessagingService.instance;
	}

	public static announceMessage(message: string): void {
		if (ChatService === undefined) return;

		const allChatSpeakers = ChatService.GetSpeakerList();

		for (const speaker of allChatSpeakers) {
			speaker.SendSystemMessage(`[ANNOUNCEMENT] ${message}`, "All");
		}
	}

	public static kickPlayer(player: Player, reason: string): void {
		player.Kick(`You have been kicked from this game. Reason: ${reason}`);
	}

	public static banPlayer(player: Player, reason: string): void {
		bannedPlayersDataStore.SetAsync(tostring(player.UserId), reason);
		player.Kick(`You are banned from this game. Reason: ${reason}`);
	}

	public listenForMessages(options: Options): void {
		if (!options.allow_messaging_service) return;

		for (const topic of ControlMessagingService.messageingServiceTopics) {
			const topicName = topic.isPrivate ? `${options.server_id}-${topic.topic}` : topic.topic;

			MessagingService.SubscribeAsync(topicName, (message: unknown) => {
				const data = (message as Message).Data;

				try {
					task.spawn(() => topic.callback(data));
				} catch (error) {
					warn(`Error while handling message from topic ${topicName}: ${error}`);
				}
			});
		}
	}
}
