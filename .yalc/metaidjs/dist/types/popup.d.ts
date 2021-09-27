import './styles/popup.css';
interface PopupOptionsTypes {
    title?: string;
    message: string;
    className?: string;
    showClose?: boolean;
    buttonText?: string;
    buttonText2?: string;
    buttonUrl?: string;
    buttonUrl2?: string;
    buttonAction?: Function;
    buttonAction2?: Function;
    useCurrentWindow?: boolean;
}
declare class Popup {
    popupWrapper: HTMLElement;
    constructor();
    info(options: PopupOptionsTypes): void;
    error(options: PopupOptionsTypes): void;
    loading(): void;
    confirm(options: PopupOptionsTypes): void;
    show(type: string | undefined, options: PopupOptionsTypes): void;
    close(): void;
    generatePopupContent(options: PopupOptionsTypes): HTMLDivElement;
}
declare const _default: Popup;
export default _default;
