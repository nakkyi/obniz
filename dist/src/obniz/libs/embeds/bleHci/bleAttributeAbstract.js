"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @packageDocumentation
 * @module ObnizCore.Components.Ble.Hci
 */
const eventemitter3_1 = __importDefault(require("eventemitter3"));
const util_1 = __importDefault(require("../../utils/util"));
const bleHelper_1 = __importDefault(require("./bleHelper"));
class BleAttributeAbstract {
    constructor(params) {
        this.uuid = bleHelper_1.default.uuidFilter(params.uuid);
        this.parent = null;
        this.children = [];
        this.isRemote = false;
        this.discoverdOnRemote = false;
        this.data = params.data || null;
        if (!this.data && params.text) {
            this.data = util_1.default.string2dataArray(params.text);
        }
        if (!this.data && params.value) {
            this.data = [params.value];
        }
        if (params[this.childrenName]) {
            for (const child of params[this.childrenName]) {
                this.addChild(child);
            }
        }
        this.setFunctions();
        this.emitter = new eventemitter3_1.default();
    }
    /**
     * @ignore
     */
    get childrenClass() {
        return Object;
    }
    /**
     * @ignore
     */
    get childrenName() {
        return null;
    }
    /**
     * @ignore
     */
    get parentName() {
        return null;
    }
    /**
     * @ignore
     * @param child
     */
    addChild(child) {
        if (!(child instanceof this.childrenClass)) {
            const childrenClass = this.childrenClass;
            child = new childrenClass(child);
        }
        const childobj = child;
        childobj.parent = this;
        this.children.push(childobj);
        return childobj;
    }
    /**
     * @ignore
     * @param uuid
     */
    getChild(uuid) {
        uuid = bleHelper_1.default.uuidFilter(uuid);
        const result = this.children
            .filter((element) => {
            return bleHelper_1.default.uuidFilter(element.uuid) === uuid;
        })
            .shift();
        if (!result) {
            return null;
        }
        return result;
    }
    /**
     * @ignore
     */
    toJSON() {
        const obj = {
            uuid: bleHelper_1.default.uuidFilter(this.uuid),
        };
        if (this.childrenName) {
            const key = this.childrenName;
            obj[key] = this.children;
        }
        if (this.data) {
            obj.data = this.data;
        }
        return obj;
    }
    /**
     * @ignore
     */
    writeText(str, needResponse) {
        this.writeTextWait(str, needResponse); // background
    }
    /**
     * @ignore
     */
    async writeTextWait(str, needResponse) {
        return await this.writeWait(util_1.default.string2dataArray(str), needResponse);
    }
    /**
     * @ignore
     */
    writeNumber(val, needResponse) {
        this.writeNumberWait(val, needResponse); // background
    }
    /**
     * @ignore
     */
    async writeNumberWait(val, needResponse) {
        return await this.writeWait([val], needResponse);
    }
    /**
     * @ignore
     */
    readFromRemoteWait() {
        return new Promise((resolve) => {
            this.emitter.once("onreadfromremote", () => {
                resolve();
            });
        });
    }
    /**
     * @ignore
     */
    writeFromRemoteWait() {
        return new Promise((resolve) => {
            this.emitter.once("onreadfromremote", (params) => {
                resolve(params.data);
            });
        });
    }
    /**
     * @ignore
     * @param err
     */
    onerror(err) {
        console.error(err.message);
    }
    /**
     * @ignore
     * @param notifyName
     * @param params
     */
    notifyFromServer(notifyName, params) {
        this.emitter.emit(notifyName, params);
        switch (notifyName) {
            case "onerror": {
                this.onerror(params);
                break;
            }
        }
    }
    setFunctions() {
        let childrenName = this.childrenName;
        if (childrenName) {
            childrenName = childrenName.charAt(0).toUpperCase() + childrenName.slice(1);
            const childName = childrenName.slice(0, -1);
            let funcName = "add" + childName;
            this[funcName] = this.addChild;
            funcName = "get" + childName;
            this[funcName] = this.getChild;
        }
        const parentName = this.parentName;
        if (parentName) {
            Object.defineProperty(this, parentName, {
                get() {
                    return this.parent;
                },
                set(newValue) {
                    this.parent = newValue;
                },
            });
        }
    }
}
exports.default = BleAttributeAbstract;

//# sourceMappingURL=bleAttributeAbstract.js.map
