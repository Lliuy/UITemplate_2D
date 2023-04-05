import UIConfig from "./UIConfig";

/**窗体类型 */
export enum FormType {
	/** 屏幕 */
	Screen = "UIScreen",
	/** 固定窗口 */
	Fixed = "UIFixed",
	/** 弹出窗口 */
	Window = "UIWindow",
	/** 独立窗口 */
	Tips = "UITips",
	/** Toast */
	Toast = "Toast",
}

/**透明度类型 */
export enum ModalOpacity {
	/** 没有mask, 可以穿透 */
	None,
	/** 完全透明，不能穿透 opacity = 0*/
	OpacityZero,
	/** 高透明度，不能穿透 opacity = 63*/
	OpacityLow,
	/** 半透明，不能穿透 opacity = 126*/
	OpacityHalf,
	/** 低透明度, 不能穿透 opacity = 170*/
	OpacityHigh,
	/** 完全不透明 opacity = 255*/
	OpacityFull
}

/** UI的状态 */
export enum UIState {
	None = 0,
	Loading = 1,
	Showing = 2,
	Hiding = 3
}
/** 常量 */
export class SysDefine {
	/* 加载窗体 */
	public static defaultLoadingForm: IFormConfig = UIConfig.LayerLoading;
	/* 路径常量 */
	public static SYS_PATH_CANVAS = "Canvas";
	/* 标签常量 */
	public static SYS_UIROOT_NAME = "Canvas";
	/* 节点常量 */
	public static SYS_SCENE_NODE = "Scene";
	public static SYS_UIROOT_NODE = "UIROOT";
	public static SYS_SCREEN_NODE = "Screen";
	public static SYS_FIXED_NODE = "FixedUI";
	public static SYS_POPUP_NODE = "PopUp";
	public static SYS_TOPTIPS_NODE = "TopTips";
	public static SYS_TOAST_NODE = "Toast";
	public static SYS_MODAL_NODE = "UIModalNode";
}

export class ModalType {
	public opacity: ModalOpacity = ModalOpacity.OpacityHalf;
	/**  点击阴影关闭 */
	public clickMaskClose = false;
	public isEasing = true;             // 缓动实现
	public easingTime = 0.2;            // 缓动时间
	public dualBlur = false;            // 模糊

	constructor (opacity = ModalOpacity.OpacityHalf, ClickMaskClose = false, IsEasing = true, EasingTime = 0.2) {
		this.opacity = opacity;
		this.clickMaskClose = ClickMaskClose;
		this.isEasing = IsEasing;
		this.easingTime = EasingTime;
	}

	useBlur () {
		this.dualBlur = true;
		return this;
	}
}

export interface IFormConfig {
	prefabUrl: string;
	type: string;
}

export interface IFormData {
	loadingForm?: IFormConfig;
	onClose?: Function;
	// window类型的form才有
	priority?: EPriority;       // 当前有已经显示的window时, 会放等待列表里, 直到 当前没有正在显示的window时才被显示
	showWait?: boolean;         // 优先级(会影响弹窗的层级, 先判断优先级, 在判断添加顺序)
	uniqueId?: string;
}

export enum EPriority {
	ZERO,
	ONE,
	TWO,
	THREE,
	FOUR,
	FIVE,
	SIX,
	SEVEN,
	EIGHT,
	NINE,
}

export enum ECloseType {
	CloseAndHide,           // 关闭后隐藏
	CloseAndDestory,        // 关闭后销毁
	LRU,                    // 使用LRU控制其销毁时机
}