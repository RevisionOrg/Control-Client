import { HttpService, MessagingService, Players } from "@rbxts/services";
import { announceMessage, banPlayer, kickPlayer, shutdownServer } from "moderation";
import { Options } from "server";

export interface Message {
	[key: string]: unknown;
}

export default class ControlMessagingService {
	private static instance: ControlMessagingService;
	private static messagingServiceTopics = [
		{
			topic: "Announcement",
			isPrivate: false,
			callback: (data: unknown) => {
				announceMessage(data as string);
			},
		},
		{
			topic: "KickPlayer",
			isPrivate: true,
			callback: (data: unknown) => {
				const { userId, reason } = HttpService.JSONDecode(data as string) as {
					userId: string;
					reason: string;
				};
				const player = Players.GetPlayerByUserId(tonumber(userId) as number);

				if (userId === undefined || reason === undefined || player === undefined) return;

				kickPlayer(player, reason);
			},
		},
		{
			topic: "BanPlayer",
			isPrivate: true,
			callback: (data: unknown) => {
				const { userId, reason } = HttpService.JSONDecode(data as string) as {
					userId: string;
					reason: string;
				};
				const player = Players.GetPlayerByUserId(tonumber(userId) as number);

				if (userId === undefined || reason === undefined || player === undefined) return;

				banPlayer(player, reason);
			},
		},
		{
			topic: "ShutdownServer",
			isPrivate: true,
			callback: () => {
				warn("Server is shutting down.");
				shutdownServer();
			},
		},
	];

	public static getInstance() {
		if (!ControlMessagingService.instance) {
			ControlMessagingService.instance = new ControlMessagingService();
		}

		return ControlMessagingService.instance;
	}

	public listenForMessages(options: Options, serverId: string): void {
		if (!options.allow_messaging_service) return;

		for (const topic of ControlMessagingService.messagingServiceTopics) {
			const topicName = topic.isPrivate ? `${serverId}${topic.topic}` : topic.topic;

			MessagingService.SubscribeAsync(topicName, (message: unknown) => {
				try {
					print(`Received message from topic ${topicName}: ${message}`);

					const data = (message as Message).Data;

					task.spawn(() => topic.callback(data));
				} catch (error) {
					warn(`Error while handling message from topic ${topicName}: ${error}`);
				}
			});
		}
	}
}
