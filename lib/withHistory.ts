import React = require("react");
import { History } from "./History";
import HistoryContext from "./HistoryContext";

export function withHistory(Component: React.ComponentClass<any>) {
    return (props: any) => {
        return React.createElement(HistoryContext.Consumer, {
            children: (history: History) =>
                React.createElement(Component, {
                    history,
                    ...props,
                }),
        });
    };
}
export default withHistory;
