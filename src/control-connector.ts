import { HttpService } from "@rbxts/services";
import { Options } from "server";

export default class ControlConnector {
	private static instance: ControlConnector;
	private options;

	constructor(options: Options) {
		this.options = options;
	}

	public static getInstance(options: Options) {
		if (!ControlConnector.instance) {
			ControlConnector.instance = new ControlConnector(options);
		}

		return ControlConnector.instance;
	}

	public controlApiRequest(route: string, data: unknown): RequestAsyncResponse {
		print("controlApiRequest: " + route);
		print(data);
		const response = HttpService.RequestAsync({
			Headers: {
				"Content-Type": "application/json",
			},
			Url: this.options.control_api_url + route,
			Method: "POST",
			Body: HttpService.JSONEncode(data),
		});

		print("response");
		print(response);

		return response;
	}
}
