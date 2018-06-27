// tslint:disable-next-line:no-implicit-dependencies
import { BackHandler } from "react-native";
export class History {
    protected routes: string[] = [];
    constructor(
        protected config: { url: string; navigate: (url: string) => any },
    ) {
        this.routes.push(config.url);
        BackHandler.addEventListener("hardwareBackPress", () => {
            this.routes.pop();
            if (this.routes.length === 0) {
                return false;
            }
            this.config.navigate(this.routes[this.routes.length - 1]);
            return true;
        });
    }
    public push(url: string) {
        this.config.navigate(url);
        this.routes.push(url);
    }
    public replace(url: string) {
        this.config.navigate(url);
        this.routes[this.routes.length - 1] = url;
    }
}
export default History;
