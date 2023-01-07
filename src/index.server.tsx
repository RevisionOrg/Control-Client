/// <reference types="@rbxts/types/plugin" />
import Roact from "@rbxts/roact";
import { RunService, ServerScriptService } from "@rbxts/services";

interface ReplaceOptions {
	api_token: string;
	game: string;
	control_api_url: string;
}

function App() {
	const colors = {
		background: Color3.fromRGB(46, 46, 46),
		foreground: Color3.fromRGB(53, 53, 53),
		border: Color3.fromRGB(31, 31, 31),
		text: Color3.fromRGB(204, 204, 204),
		secondaryText: Color3.fromRGB(130, 130, 130),
		hover: Color3.fromRGB(60, 60, 60),
		main: Color3.fromRGB(0, 119, 248),
		error: Color3.fromRGB(161, 33, 33),
		secondary: Color3.fromRGB(232, 232, 234),
		scrollbar: new Color3(0.25, 0.25, 0.25),
		scrollbarBack: Color3.fromRGB(41, 41, 41),
	};
	const apiTokenRef = Roact.createRef<TextBox>();
	const gameIdRef = Roact.createRef<TextBox>();
	const statusTextRef = Roact.createRef<TextLabel>();

	return (
		<frame
			Size={new UDim2(1, -20, 1, -20)}
			BackgroundColor3={colors.background}
			Position={new UDim2(0, 10, 0, 10)}
			BorderColor3={colors.background}
		>
			<uilistlayout FillDirection={Enum.FillDirection.Vertical} Padding={new UDim(0, 10)} />
			<textbox
				Size={new UDim2(1, 0, 0, 50)}
				BackgroundColor3={colors.background}
				Text=""
				PlaceholderText={"API Token"}
				Ref={apiTokenRef}
				PlaceholderColor3={colors.secondaryText}
				TextColor3={colors.text}
				TextSize={14}
				BorderSizePixel={0}
				TextXAlignment={Enum.TextXAlignment.Left}
				ClearTextOnFocus={false}
			/>
			<textbox
				Size={new UDim2(1, 0, 0, 50)}
				BackgroundColor3={colors.background}
				Text=""
				PlaceholderText={"Game ID"}
				Ref={gameIdRef}
				PlaceholderColor3={colors.secondaryText}
				TextColor3={colors.text}
				TextSize={14}
				BorderSizePixel={0}
				TextXAlignment={Enum.TextXAlignment.Left}
				ClearTextOnFocus={false}
			/>
			<textbutton
				Size={new UDim2(1, 0, 0, 50)}
				BackgroundColor3={colors.foreground}
				BorderSizePixel={0}
				Text="Import Client"
				TextColor3={colors.text}
				TextSize={14}
				Event={{
					MouseButton1Click: () => {
						const statusText = statusTextRef.getValue();
						try {
							importScripts({
								// eslint-disable-next-line roblox-ts/lua-truthiness
								api_token: apiTokenRef.getValue()?.Text || "",
								// eslint-disable-next-line roblox-ts/lua-truthiness
								game: gameIdRef.getValue()?.Text || "",
								control_api_url: "https://control.tim-ritter.com/api",
							});
							if (statusText !== undefined) {
								statusText.Text =
									"Control has been successfully imported! You can find it in ServerScriptService.";
								statusText.TextColor3 = colors.main;
								statusText.Visible = true;
							}
						} catch (e) {
							if (statusText !== undefined) {
								statusText.Text = "Error";
								statusText.TextColor3 = colors.error;
								statusText.Visible = true;
							}
						}
					},
				}}
			/>
			<textlabel
				Size={new UDim2(1, 0, 0, 50)}
				BackgroundColor3={colors.background}
				BorderSizePixel={0}
				Text="Test"
				TextWrapped={true}
				TextColor3={colors.text}
				TextSize={14}
				TextScaled={true}
				Visible={false}
				Ref={statusTextRef}
			/>
		</frame>
	);
}

class pluginWindow {
	pluginWindow;
	pluginWindowInfo;

	constructor(plugin: Plugin) {
		this.pluginWindowInfo = new DockWidgetPluginGuiInfo(
			Enum.InitialDockState.Right,
			false,
			false,
			200,
			270,
			200,
			270,
		);
		this.pluginWindow = plugin.CreateDockWidgetPluginGui("pluginWindow", this.pluginWindowInfo);

		this.pluginWindow.Enabled = false;
		this.pluginWindow.Title = "Control";

		const mountedGui = Roact.mount(<App />, this.pluginWindow, "ControlGui");

		plugin.Unloading.Connect(() => {
			Roact.unmount(mountedGui);
		});
	}

	toggle() {
		this.pluginWindow.Enabled = !this.pluginWindow.Enabled;
	}
}

function importScripts(options: ReplaceOptions) {
	const oldControlFolder = ServerScriptService.FindFirstChild("Control");
	const controlFolder = new Instance("Folder", ServerScriptService);

	if (oldControlFolder !== undefined) {
		oldControlFolder.Destroy();
	}

	controlFolder.Name = "Control";

	script.GetChildren().forEach((child) => {
		if (typeIs(child, "Instance") === false) {
			return;
		}
		const clone = child.Clone();

		clone.Parent = controlFolder;

		if (clone.Name === "client" && clone.IsA("ModuleScript")) {
			let source = clone.Source;
			const newScript = new Instance("Script", clone.Parent);

			source = source.gsub("CONTROL_API_URL", options.control_api_url)[0];
			source = source.gsub("CONTROL_GAME_ID", options.game)[0];
			source = source.gsub("CONTROL_API_TOKEN", options.api_token)[0];

			newScript.Name = clone.Name;
			newScript.Source = source;
			clone.Destroy();
		}
	});
}

function main() {
	if (RunService.IsRunning()) {
		return;
	}

	let newPluginWindow: pluginWindow | undefined;
	const toolbar = plugin.CreateToolbar("Control");
	const toggleButton = toolbar.CreateButton(
		"Open Control",
		"Open Control",
		"https://www.roblox.com/asset/?id=12069231883",
	);

	toggleButton.Click.Connect(() => {
		if (newPluginWindow === undefined) {
			newPluginWindow = new pluginWindow(plugin);
		}

		newPluginWindow.toggle();
	});
}

main();
