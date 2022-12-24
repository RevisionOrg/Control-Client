import { HttpService, LogService, Players } from "@rbxts/services";
import { ActivePlayer } from "server";

interface IPResponse {
	query: string;
}

interface LocationResponse {
	country: string;
}

export default class DataCollector {
	private static instance: DataCollector;

	public static getInstance() {
		if (!DataCollector.instance) {
			DataCollector.instance = new DataCollector();
		}

		return DataCollector.instance;
	}

	public collectConsoleLogs(): string {
		const consoleLogHistory = LogService.GetLogHistory();
		const consoleLog: string[] = [];

		for (const log of consoleLogHistory) {
			consoleLog.push(`${log.timestamp} - ${log.message}`);
		}

		return consoleLog.join("\n");
	}

	public collectActivePlayers(): ActivePlayer[] {
		const activePlayers: ActivePlayer[] = [];

		for (const player of Players.GetPlayers()) {
			activePlayers.push({
				name: player.Name,
				roblox_id: tostring(player.UserId),
				account_age: tostring(player.AccountAge),
			});
		}

		return activePlayers;
	}

	public collectIp(): string {
		const response = HttpService.GetAsync("http://ip-api.com/json");

		return (HttpService.JSONDecode(response) as IPResponse).query;
	}

	public collectLocation(ip: string): string {
		const response = HttpService.GetAsync("http://ip-api.com/json/" + ip);

		return (HttpService.JSONDecode(response) as LocationResponse).country;
	}
}
