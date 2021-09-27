import { MetaIdJs } from "./metaidjs";
declare global {
    interface Window {
        MetaIdJs?: Function;
        handleNotEnoughMoney?: Function;
    }
}
export default MetaIdJs;
