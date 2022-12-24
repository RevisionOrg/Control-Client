import { HttpService, Players } from "@rbxts/services";
import ControlConnector from "control-connector";
import ControlMessagingService, { bannedPlayersDataStore } from "control-messaging-service";
import DataCollector from "data-collector";

declare function loadstring(str: string): (...args: unknown[]) => unknown;

export interface Options {
	api_token: string;
	game: string;
	control_api_url: string;
	allow_actions: boolean;
	allow_messaging_service: boolean;
	update_interval: number;
	control_api_routes: {
		register: string;
		deregister: string;
		update: string;
	};
	server_id: string;
}

interface AuthenticatedRequest {
	token: string;
	gameId: string;
}

interface RegisterRequest extends AuthenticatedRequest {
	server: {
		location: string;
		ip: string;
	};
}

interface RegisterResponse {
	serverId?: string;
	error?: string;
}

interface UpdateResponse {
	error?: string;
	hasAction?: boolean;
	action?: string;
}

export interface ActivePlayer {
	name: string;
	roblox_id: string;
	account_age: string;
}

interface UpdateRequest extends AuthenticatedRequest {
	server: {
		id: string;
		chat_log: string;
		console_log: string;
		active_players: ActivePlayer[];
	};
}

interface DeregisterRequest extends AuthenticatedRequest {
	serverId: string;
}

export default class Server {
	private options: Options;
	private controlConnector;
	private dataCollector = DataCollector.getInstance();
	private controlMessagingService = ControlMessagingService.getInstance();
	private serverId: string | undefined;
	private chatLog = "";
	private consoleLog = "";
	private activePlayers: ActivePlayer[] = [];
	private location = "";
	private ip = "";

	private processPlayer(player: Player) {
		const isBanned = bannedPlayersDataStore.GetAsync(tostring(player.UserId));

		if (isBanned && typeIs(isBanned, "string")) {
			player.Kick(`You are banned from this game. Reason: ${tostring(isBanned)}`);

			return;
		}

		player.Chatted.Connect((message) => {
			this.chatLog += `\n${player.Name} (${player.UserId}) - ${message}`;
			this.chatLog = this.chatLog
				.split("\n")
				.filter((_, index) => {
					return index <= 200;
				})
				.join("\n");
		});
	}

	constructor(options: Options) {
		this.options = options;
		this.controlMessagingService.listenForMessages(options);
		this.controlConnector = ControlConnector.getInstance(options);
		this.ip = this.dataCollector.collectIp();
		this.location = this.dataCollector.collectLocation(this.ip);

		Players.GetPlayers().forEach((player) => {
			this.processPlayer(player);
		});

		Players.PlayerAdded.Connect((player) => {
			this.processPlayer(player);
		});
	}

	public register(): void {
		const registerResponse = this.controlConnector.controlApiRequest(this.options.control_api_routes.register, {
			token: this.options.api_token,
			gameId: this.options.game,
			server: {
				location: this.location,
				ip: this.ip,
			},
		} as RegisterRequest);

		if (!registerResponse.Success) {
			print(registerResponse);
			error("Failed to register server");
		}

		const response = HttpService.JSONDecode(registerResponse.Body) as RegisterResponse;

		if (response.error !== undefined) {
			error(response.error);
		}

		this.serverId = response.serverId;
	}

	public deregister(): void {
		const deregisterResponse = this.controlConnector.controlApiRequest(this.options.control_api_routes.deregister, {
			token: this.options.api_token,
			gameId: this.options.game,
			serverId: this.serverId,
		} as DeregisterRequest);

		if (!deregisterResponse.Success) {
			error("Failed to deregister server " + deregisterResponse);
		}
	}

	public update(): void {
		this.consoleLog = this.dataCollector.collectConsoleLogs();
		this.activePlayers = this.dataCollector.collectActivePlayers();

		const updateResponse = this.controlConnector.controlApiRequest(this.options.control_api_routes.update, {
			token: this.options.api_token,
			gameId: this.options.game,
			server: {
				id: this.serverId,
				chat_log: this.chatLog,
				console_log: this.consoleLog,
				active_players: this.activePlayers,
			},
		} as UpdateRequest);

		if (!updateResponse.Success) {
			warn("Failed to update server " + updateResponse);
		}

		const response = HttpService.JSONDecode(updateResponse.Body) as UpdateResponse;

		if (response.error !== undefined) {
			warn(response.error);
		}

		if (response.hasAction === true && response.action !== undefined && this.options.allow_actions) {
			try {
				task.spawn(() => {
					if (response.action !== undefined) {
						loadstring(response.action)();
					}
				});
			} catch (error) {
				print("Failed to execute action: " + error);
			}
		}
	}

	public connectMessagingService() {}
}
