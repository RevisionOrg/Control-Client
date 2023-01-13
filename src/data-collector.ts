import { HttpService, LogService, Players, Stats } from "@rbxts/services";
import { ActivePlayer } from "server";

interface IPResponse {
	query: string;
}

interface LocationResponse {
	country: string;
}

interface DiagnosticsEntry {
	value: number;
	health: "Healthy" | "Degraded" | "Unhealthy";
}

export interface Diagnostics {
	contactsCount: DiagnosticsEntry;
	dataReceiveKbps: DiagnosticsEntry;
	dataSendKbps: DiagnosticsEntry;
	heartbeatTimeMs: DiagnosticsEntry;
	instanceCount: DiagnosticsEntry;
	movingPrimitivesCount: DiagnosticsEntry;
	physicsReceiveKbps: DiagnosticsEntry;
	physicsSendKbps: DiagnosticsEntry;
	physicsStepTimeMs: DiagnosticsEntry;
	primitivesCount: DiagnosticsEntry;
	totalMemoryUsageMb: DiagnosticsEntry;
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

	public collectDiagnostics(): Diagnostics {
		return {
			instanceCount: {
				value: Stats.InstanceCount,
				health:
					Stats.InstanceCount > 10000000 ? "Unhealthy" : Stats.InstanceCount > 7000 ? "Degraded" : "Healthy",
			},
			primitivesCount: {
				value: Stats.PrimitivesCount,
				health: "Healthy",
			},
			movingPrimitivesCount: {
				value: Stats.MovingPrimitivesCount,
				health:
					Stats.MovingPrimitivesCount > 1000
						? "Unhealthy"
						: Stats.MovingPrimitivesCount > 500
						? "Degraded"
						: "Healthy",
			},
			contactsCount: {
				value: Stats.ContactsCount,
				health:
					Stats.ContactsCount > 100000 ? "Unhealthy" : Stats.ContactsCount > 50000 ? "Degraded" : "Healthy",
			},
			physicsStepTimeMs: {
				value: Stats.PhysicsStepTimeMs,
				health:
					Stats.PhysicsStepTimeMs > 10 ? "Unhealthy" : Stats.PhysicsStepTimeMs > 6 ? "Degraded" : "Healthy",
			},
			physicsSendKbps: {
				value: Stats.PhysicsSendKbps,
				health: "Healthy",
			},
			physicsReceiveKbps: {
				value: Stats.PhysicsReceiveKbps,
				health: "Healthy",
			},
			dataSendKbps: {
				value: Stats.DataSendKbps,
				health: "Healthy",
			},
			dataReceiveKbps: {
				value: Stats.DataReceiveKbps,
				health: "Healthy",
			},
			heartbeatTimeMs: {
				value: Stats.HeartbeatTimeMs,
				health: "Healthy",
			},
			totalMemoryUsageMb: {
				value: Stats.GetTotalMemoryUsageMb(),
				health:
					Stats.GetTotalMemoryUsageMb() > 4000
						? "Unhealthy"
						: Stats.GetTotalMemoryUsageMb() > 3000
						? "Degraded"
						: "Healthy",
			},
		};
	}
}
