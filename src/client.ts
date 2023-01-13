import Server, { Options } from "server";

const options: Options = {
	api_token: "CONTROL_API_TOKEN",
	game: "CONTROL_GAME_ID",
	control_api_url: "CONTROL_API_URL",
	allow_actions: true,
	allow_messaging_service: true,
	update_interval: 120,
	control_api_routes: {
		register: "/rest/server/register",
		deregister: "/rest/server/deregister",
		update: "/rest/server/update",
	},
};

function main() {
	const server = new Server(options);

	server.register();
	server.update();
	server.connectMessagingService();

	game.BindToClose(() => {
		server.deregister();
	});

	print(`Connected to Control. Server ID: ${server.serverId}`);

	task.spawn(() => {
		while (wait(options.update_interval)) {
			try {
				server.update();
			} catch (error) {
				warn(`Failed to update server: ${error}`);
			}
		}
	});
}

main();
