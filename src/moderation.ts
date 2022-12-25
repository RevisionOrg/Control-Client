import { DataStoreService, Players, TeleportService } from "@rbxts/services";

export const bannedPlayersDataStore = DataStoreService.GetDataStore("BannedPlayers");

interface ChatSpeaker {
	SendSystemMessage(message: string, channel: string): void;
}

interface ChatService {
	GetSpeakerList(): string[];
	GetSpeaker(name: string): ChatSpeaker;
}

export const ChatService = require(game
	.GetService("ServerScriptService")
	.WaitForChild("ChatServiceRunner")
	.WaitForChild("ChatService") as ModuleScript) as ChatService;

export function announceMessage(message: string): void {
	if (ChatService === undefined) return;

	const allChatSpeakers = ChatService.GetSpeakerList();

	for (const speakerName of allChatSpeakers) {
		const speaker = ChatService.GetSpeaker(speakerName);

		speaker.SendSystemMessage(`[ANNOUNCEMENT] ${message}`, "All");
	}
}

export function kickPlayer(player: Player, reason: string): void {
	player.Kick(`You have been kicked from this game. Reason: ${reason}`);
}

export function banPlayer(player: Player, reason: string): void {
	bannedPlayersDataStore.SetAsync(tostring(player.UserId), reason);
	player.Kick(`You are banned from this game. Reason: ${reason}`);
}

export function shutdownServer(): void {
	const placeId = game.PlaceId;
	const reservedServer = TeleportService.ReserveServer(placeId);

	TeleportService.TeleportToPrivateServer(placeId, reservedServer[0], Players.GetPlayers());

	Players.PlayerAdded.Connect((player) => {
		TeleportService.TeleportToPrivateServer(placeId, reservedServer[0], [player]);
	});
}
