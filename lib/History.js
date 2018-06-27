"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable-next-line:no-implicit-dependencies
const react_native_1 = require("react-native");
class History {
    constructor(config) {
        this.config = config;
        this.routes = [];
        this.routes.push(config.url);
        react_native_1.BackHandler.addEventListener("hardwareBackPress", () => {
            this.routes.pop();
            if (this.routes.length === 0) {
                return false;
            }
            this.config.navigate(this.routes[this.routes.length - 1]);
            return true;
        });
    }
    push(url) {
        this.config.navigate(url);
        this.routes.push(url);
    }
    replace(url) {
        this.config.navigate(url);
        this.routes[this.routes.length - 1] = url;
    }
}
exports.History = History;
exports.default = History;
