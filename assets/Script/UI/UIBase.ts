import UIManager from "./UIManager";
import FormMgr from "./FormMgr";
import { FormType, ModalOpacity, ModalType } from "./UIDefine";
import { ECloseType, IFormData } from "./UIDefine";
import CocosHelper from "./CocosHelper";

export default class UIBase extends cc.Component {
	/** 窗体id,该窗体的唯一标示(请不要对这个值进行赋值操作, 内部已经实现了对应的赋值) */
	public fid: string = '';
	/** 窗体数据 */
	public formData: IFormData | null = null;
	/** 窗体类型 */
	public formType: FormType | null = null;
	/** 关闭类型, 关闭窗口后销毁, 会将其依赖的资源一并销毁, 采用了引用计数的管理, 不用担心会影响其他窗体 */
	public closeType: ECloseType | null = null;
	/** 是否已经调用过preinit方法 */
	private _inited = false;

	public view: cc.Component = null;

	public static open (param?: any, formData?: IFormData) {
		let uiconfig = this['UIConfig'];
		if (!uiconfig) {
			cc.warn(`sorry UIConfig is null, please check UIConfig`);
			return;
		}
		FormMgr.open(uiconfig, param, formData);
	}

	public static close () {
		FormMgr.close(this['UIConfig']);
	}

	/** 预先初始化 */
	public async _preInit (params: any) {
		if (this._inited) return;
		this._inited = true;
		this.view = this.getComponent(`${this.node.name}_Auto`);
		// 加载这个UI依赖的其他资源
		let errorMsg = await this.load(params);
		if (errorMsg) {
			cc.error(errorMsg);
			this.closeSelf();
			return;
		}
		this.onInit(params);
	}

	model: any = null;

	/** 可以在这里进行一些资源的加载, 具体实现可以看test下的代码 */
	public async load (params: any): Promise<string> {
		return null;
	}

	/** 初始化, 只调用一次 */
	public onInit (params: any) {}
	/**  显示回调在 onLoad之前 */
	public onShow (params: any) {}
	/**  在显示动画结束后回调 */
	public onAfterShow (params: any) {}
	/**  隐藏回调 */
	public onHide () {}
	/**  在隐藏动画结束后回调 */
	public onAfterHide () {}

	/**  关闭自己 */
	public async closeSelf (): Promise<boolean> {
		return await UIManager.getInstance().closeForm(this.fid);
	}

	/**
	 * 弹窗动画
	 */
	public async showEffect () {}
	public async hideEffect () {}

	/** 设置是否挡住触摸事件 */
	private _blocker: cc.BlockInputEvents = null;
	public setBlockInput (block: boolean) {
		if (!this._blocker) {
			let node = new cc.Node('block_input_events');
			this._blocker = node.addComponent(cc.BlockInputEvents);
			this.node.addChild(this._blocker.node, cc.macro.MAX_ZINDEX);
		}
		this._blocker.node.active = block;
	}
}

/*********************************************  
 * 	UIBase 扩展类
 ********************************************/

/**  全屏 */
export class UIScreen extends UIBase {
	formType = FormType.Screen;
	closeType = ECloseType.CloseAndDestory;

	public async closeSelf (): Promise<boolean> {
		return await FormMgr.close({ prefabUrl: this.fid, type: this.formType });
	}

	public async showEffect () {
		let animName = `${this.node.name}_进入`;
		await CocosHelper.playAnimation(this.node, animName);
	}

	public async hideEffect () {
		let animName = `${this.node.name}_退出`;
		await CocosHelper.playAnimation(this.node, animName);
	}
}
/**  弹窗 */
export class UIWindow extends UIBase {
	formType = FormType.Window;
	modalType = new ModalType(ModalOpacity.OpacityHigh);                // 阴影类型
	closeType = ECloseType.CloseAndDestory;

	/** 显示效果 */
	public async showEffect () {
		let animName = `${this.node.name}_进入`;
		let ret = await CocosHelper.playAnimation(this.node, animName);
		if (!ret) {
			this.node.scale = 0;
			await CocosHelper.runTweenSync(this.node, cc.tween().to(0.3, { scale: 1 }, cc.easeBackOut()));
		}
	}

	public async hideEffect () {
		let animName = `${this.node.name}_退出`;
		let ret = await CocosHelper.playAnimation(this.node, animName);
		if (!ret) {
			await CocosHelper.runTweenSync(this.node, cc.tween().to(0.3, { scale: 0 }, cc.easeBackIn()));
		}
	}

	public async closeSelf (): Promise<boolean> {
		return await FormMgr.close({ prefabUrl: this.fid, type: this.formType });
	}
}

/**  固定窗口 */
export class UIFixed extends UIBase {
	formType = FormType.Fixed;
	closeType = ECloseType.CloseAndDestory;

	public async closeSelf (): Promise<boolean> {
		return await FormMgr.close({ prefabUrl: this.fid, type: this.formType });
	}
}

export class UITips extends UIBase {
	formType = FormType.Tips;
	closeType = ECloseType.CloseAndDestory;

	public async closeSelf (): Promise<boolean> {
		return await FormMgr.close({ prefabUrl: this.fid, type: this.formType });
	}
}

export class UIToast extends UIBase {
	public formType: FormType = FormType.Toast;
	public closeType: ECloseType = ECloseType.CloseAndDestory;

	public async closeSelf (): Promise<boolean> {
		return await FormMgr.close({ prefabUrl: this.fid, type: this.formType });
	}
}
