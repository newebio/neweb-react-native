"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const HistoryContext_1 = require("./HistoryContext");
function withHistory(Component) {
    return (props) => {
        return React.createElement(HistoryContext_1.default.Consumer, {
            children: (history) => React.createElement(Component, Object.assign({ history }, props)),
        });
    };
}
exports.withHistory = withHistory;
exports.default = withHistory;
