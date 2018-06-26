import debug = require("debug");
import {
    BaseController,
    ClassicRouter,
    Client,
    ClientPageRenderer,
    IClientTransportInputMessage,
    IClientTransportOutputMessage,
    IServerTransportClient,
    IServerTransportClientInputMessage,
    IServerTransportClientOutputMessage,
    MatchedRoute,
    PageRouteByFrame,
    Server,
} from "neweb-core";
import { frameBy } from "neweb-react";
import React = require("react");
import { Subject } from "rxjs";
export class Application extends React.Component<
    {
        ModuleResolver: {
            resolve: (path: string) => any;
        };
        url: string;
    },
    {
        component: any;
    }
> {
    public state: any = { component: undefined };
    public componentWillMount() {
        const serverTransport = {
            onConnect: new Subject<IServerTransportClient>(),
        };
        const server = Server.create({
            ControllersFactory: {
                create: (frameName, props) => {
                    const ControllerModule = this.props.ModuleResolver.resolve(
                        "frames/" + frameName + "/controller",
                    );
                    if (!ControllerModule) {
                        return new BaseController<any>(props);
                    }
                    return new ControllerModule.default(props);
                },
            },
            RoutersFactory: {
                createRouter: () => {
                    const RouterModule = this.props.ModuleResolver.resolve(
                        "Router",
                    );
                    if (!RouterModule) {
                        // tslint:disable-next-line:max-classes-per-file
                        return new class extends ClassicRouter {
                            public onInit() {
                                this.addRoute(
                                    MatchedRoute(
                                        { path: "/" },
                                        PageRouteByFrame({
                                            frameName: "index",
                                        }),
                                    ),
                                );
                            }
                        }();
                    }
                    return new RouterModule.default();
                },
            },
            transport: serverTransport,
        });
        const clientTransport = {
            onConnect: new Subject(),
            onConnecting: new Subject(),
            onDisconnect: new Subject(),
            inputMessage: new Subject<IClientTransportInputMessage>(),
            outputMessage: new Subject<IClientTransportOutputMessage>(),
        };
        server.start();
        const client = new Client({
            transport: clientTransport as any,
            url: this.props.url,
        });
        const renderer = new ClientPageRenderer({
            RendererComponentsFactory: {
                create: (frameName: string, props) => {
                    const ViewModule = this.props.ModuleResolver.resolve(
                        "frames/" + frameName + "/view",
                    );
                    const ViewComponent = ViewModule
                        ? ViewModule.default
                        : () => null;
                    return frameBy(ViewComponent)(props);
                },
            },
            renderRootComponent: (component: any) => {
                this.setState({ component });
            },
            replaceRootComponent: (component: any) => {
                this.setState({ component });
            },
        });
        client.onNewPage.subscribe(renderer.emitNewPage);
        client.onChangeNavigateStatus.subscribe(
            renderer.onChangeNavigateStatus,
        );
        client.onChangeNetworkStatus.subscribe(renderer.onChangeNetworkStatus);
        client.onControllerMessage.subscribe(renderer.onControllerMessage);
        renderer.emitControllerMessage.subscribe(client.emitControllerMessage);
        renderer.onNavigate.subscribe((p) =>
            client.emitNavigate.next({ url: p }),
        );

        const serverTransportClient = {
            getExtraInfo: () => null,
            getSessionId: () => "",
            inputMessage: new Subject<IServerTransportClientInputMessage>(),
            outputMessage: new Subject<IServerTransportClientOutputMessage>(),
        };
        serverTransportClient.outputMessage.subscribe((message) => {
            debug("neweb-browser")("server transport output message", message);
            clientTransport.inputMessage.next(message);
        });
        clientTransport.outputMessage.subscribe((message: any) => {
            debug("neweb-browser")("client transport output message", message);
            serverTransportClient.inputMessage.next(message);
        });
        serverTransport.onConnect.next(serverTransportClient);
        clientTransport.onConnect.next();
    }
    public render() {
        return this.state.component
            ? React.createElement(this.state.component)
            : null;
    }
}
export default Application;
