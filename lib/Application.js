"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("debug");
const neweb_core_1 = require("neweb-core");
const neweb_react_1 = require("neweb-react");
const React = require("react");
const rxjs_1 = require("rxjs");
class Application extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { component: undefined };
    }
    componentWillMount() {
        const serverTransport = {
            onConnect: new rxjs_1.Subject(),
        };
        const server = neweb_core_1.Server.create({
            ControllersFactory: {
                create: (frameName, props) => {
                    const ControllerModule = this.props.ModuleResolver.resolve("frames/" + frameName + "/controller");
                    if (!ControllerModule) {
                        return new neweb_core_1.BaseController(props);
                    }
                    return new ControllerModule.default(props);
                },
            },
            RoutersFactory: {
                createRouter: () => {
                    const RouterModule = this.props.ModuleResolver.resolve("Router");
                    if (!RouterModule) {
                        // tslint:disable-next-line:max-classes-per-file
                        return new class extends neweb_core_1.ClassicRouter {
                            onInit() {
                                this.addRoute(neweb_core_1.MatchedRoute({ path: "/" }, neweb_core_1.PageRouteByFrame({
                                    frameName: "index",
                                })));
                            }
                        }();
                    }
                    return new RouterModule.default();
                },
            },
            transport: serverTransport,
        });
        const clientTransport = {
            onConnect: new rxjs_1.Subject(),
            onConnecting: new rxjs_1.Subject(),
            onDisconnect: new rxjs_1.Subject(),
            inputMessage: new rxjs_1.Subject(),
            outputMessage: new rxjs_1.Subject(),
        };
        server.start();
        const client = new neweb_core_1.Client({
            transport: clientTransport,
            url: this.props.url,
        });
        const renderer = new neweb_core_1.ClientPageRenderer({
            RendererComponentsFactory: {
                create: (frameName, props) => {
                    const ViewModule = this.props.ModuleResolver.resolve("frames/" + frameName + "/view");
                    const ViewComponent = ViewModule
                        ? ViewModule.default
                        : () => null;
                    return neweb_react_1.frameBy(ViewComponent)(props);
                },
            },
            renderRootComponent: (component) => {
                this.setState({ component });
            },
            replaceRootComponent: (component) => {
                this.setState({ component });
            },
        });
        client.onNewPage.subscribe(renderer.emitNewPage);
        client.onChangeNavigateStatus.subscribe(renderer.onChangeNavigateStatus);
        client.onChangeNetworkStatus.subscribe(renderer.onChangeNetworkStatus);
        client.onControllerMessage.subscribe(renderer.onControllerMessage);
        renderer.emitControllerMessage.subscribe(client.emitControllerMessage);
        renderer.onNavigate.subscribe((p) => client.emitNavigate.next({ url: p }));
        const serverTransportClient = {
            getExtraInfo: () => null,
            getSessionId: () => "",
            inputMessage: new rxjs_1.Subject(),
            outputMessage: new rxjs_1.Subject(),
        };
        serverTransportClient.outputMessage.subscribe((message) => {
            debug("neweb-browser")("server transport output message", message);
            clientTransport.inputMessage.next(message);
        });
        clientTransport.outputMessage.subscribe((message) => {
            debug("neweb-browser")("client transport output message", message);
            serverTransportClient.inputMessage.next(message);
        });
        serverTransport.onConnect.next(serverTransportClient);
        clientTransport.onConnect.next();
    }
    render() {
        return this.state.component ? this.state.component : null;
    }
}
exports.Application = Application;
exports.default = Application;
