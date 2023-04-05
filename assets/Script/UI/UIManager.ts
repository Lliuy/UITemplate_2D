import UIBase, { UIWindow } from "./UIBase";
import { SysDefine, FormType, ECloseType, IFormData } from "./UIDefine";
import ResMgr from "./ResMgr";
import ModalMgr from "./ModalMgr";

export default class UIManager {
	private _UIROOT: cc.Node = null;    // UIROOT
	private _ndScreen: cc.Node = null;  // 全屏显示的UI 挂载结点
	private _ndFixed: cc.Node = null;  // 固定显示的UI
	private _ndPopUp: cc.Node = null;  // 弹出窗口
	private _ndTips: cc.Node = null;  // 独立窗体
	private _ndToast: cc.Node = null;

	/**  存储弹出的窗体 */
	private _windows: UIWindow[] = [];
	/**  所有已经挂载的窗体, 可能没有显示 */
	private _allForms: { [key: string]: UIBase } = cc.js.createMap();
	/**  正在显示的窗体  */
	private _showingForms: { [key: string]: UIBase } = cc.js.createMap();
	/**  正在加载的窗体 */
	private _loadingForm: { [key: string]: ((value: UIBase) => void)[] } = cc.js.createMap();

	private static instance: UIManager = null;                                                 // 单例
	public static getInstance(): UIManager {
		if (this.instance == null) {
			this.instance = new UIManager();
			let scene = cc.director.getScene().getChildByName("Canvas");
			let UIROOT = scene;

			UIROOT.addChild(this.instance._ndScreen = new cc.Node(SysDefine.SYS_SCREEN_NODE));
			UIROOT.addChild(this.instance._ndFixed = new cc.Node(SysDefine.SYS_FIXED_NODE));
			UIROOT.addChild(this.instance._ndPopUp = new cc.Node(SysDefine.SYS_POPUP_NODE));
			UIROOT.addChild(this.instance._ndTips = new cc.Node(SysDefine.SYS_TOPTIPS_NODE));
			UIROOT.addChild(this.instance._ndToast = new cc.Node(SysDefine.SYS_TOAST_NODE));

			this.instance._ndScreen.setContentSize(cc.winSize);
			this.instance._ndPopUp.setContentSize(cc.winSize);
			this.instance._ndFixed.setContentSize(cc.winSize);
			this.instance._ndTips.setContentSize(cc.winSize);
			this.instance._ndToast.setContentSize(cc.winSize);

			cc.director.once(cc.Director.EVENT_BEFORE_SCENE_LAUNCH, () => {
				this.instance = null;
			});

		}
		return this.instance;
	}

	/** 预加载UIForm */
	public async loadUIForm(prefabPath: string) {
		let uiBase = await this._loadForm(prefabPath);
		if (!uiBase) {
			console.warn(`${uiBase}没有被成功加载`);
			return null;
		}
		return uiBase;
	}

	/**
	 * 加载显示一个UIForm
	 * @param prefabPath 
	 * @param params 
	 * @param formData 
	 * @returns 
	 */
	public async openForm(prefabPath: string, params?: any, formData?: IFormData) {
		if (!prefabPath || prefabPath.length <= 0) {
			cc.warn(`${prefabPath}, 参数错误`);
			return null;
		}
		if (this.checkFormShowing(prefabPath)) {
			cc.warn(`${prefabPath}, 窗体正在显示中`);
			return null;
		}
		let com = await this._loadForm(prefabPath);
		if (!com) {
			cc.warn(`${prefabPath} 加载失败了!`);
			return null;
		}

		// 初始化窗体名称
		com.fid = prefabPath;
		com.formData = formData;

		switch (com.formType) {
			case FormType.Screen:
				await this.enterToScreen(com.fid, params);
				break;
			case FormType.Window:
				await this.enterToPopup(com.fid, params);
				break;
			case FormType.Fixed:
				await this.enterToFixed(com.fid, params);
				break;
			case FormType.Tips:                                  // 独立显示
				await this.enterToTips(com.fid, params);
				break;
			case FormType.Toast:
				await this.enterToToast(com.fid, params);
				break;
		}

		// 如果这个窗体在lru中存在, 那么立即删除它
		// if (com.closeType === ECloseType.LRU) {
		// 	this._LRUCache.remove(com.fid);
		// }

		return com;
	}


	/**
	 * 重要方法 关闭一个UIForm
	 * @param prefabPath 
	 */
	public async closeForm(prefabPath: string) {
		if (!prefabPath || prefabPath.length <= 0) {
			cc.warn(`${prefabPath}, 参数错误`);
			return;
		};
		let com = this._allForms[prefabPath];
		if (!com) return false;

		let fid = com.fid;
		switch (com.formType) {
			case FormType.Screen:
				await this.exitToScreen(fid);
				break;
			case FormType.Fixed:                             // 普通模式显示
				await this.exitToFixed(fid);
				break;
			case FormType.Window:
				await this.exitToPopup(fid);
				break;
			case FormType.Tips:
				await this.exitToTips(fid);
				break;
			case FormType.Toast:
				await this.exitToToast(fid);
				break;
		}

		if (com.formData) {
			com.formData.onClose && com.formData.onClose();
		}

		// 根据closeType 处理
		switch (com.closeType) {
			case ECloseType.CloseAndDestory:
				this.destoryForm(com);
				break;
			// case ECloseType.LRU:
			// 	this.putLRUCache(com);
			// 	break;
		}
		return true;
	}

	/**
	 * 从窗口缓存中加载(如果没有就会在load加载), 并挂载到结点上
	 */
	private async _loadForm(prefabPath: string): Promise<UIBase> {
		let com = this._allForms[prefabPath];
		if (com) {
			if (com.formType !== FormType.Toast) {
				return com;
			}
		}
		return new Promise((resolve, reject) => {
			if (this._loadingForm[prefabPath]) {
				this._loadingForm[prefabPath].push(resolve);
				return;
			}
			this._loadingForm[prefabPath] = [resolve];
			this._doLoadUIForm(prefabPath).then((com: UIBase) => {
				for (const func of this._loadingForm[prefabPath]) {
					func(com);
				}
				this._loadingForm[prefabPath] = null;
				delete this._loadingForm[prefabPath];
			});
		});
	}

	/**
	 * @param prefabPath 
	 */
	private async _doLoadUIForm(prefabPath: string) {
		let prefab = await ResMgr.inst.loadFormPrefab(prefabPath);
		let node = cc.instantiate(prefab);
		if (!node) {
			return;
		}
		let com = node.getComponent(UIBase);
		if (!com) {
			cc.warn(`${prefabPath} 结点没有绑定UIBase`);
			return null;
		}
		node.active = false;                    // 避免baseCom调用了onload方法
		switch (com.formType) {
			case FormType.Screen:
				this._ndScreen.addChild(node);
				break;
			case FormType.Fixed:
				this._ndFixed.addChild(node);
				break;
			case FormType.Window:
				this._ndPopUp.addChild(node);
				break;
			case FormType.Tips:
				this._ndTips.addChild(node);
				break;
			case FormType.Toast:
				this._ndToast.addChild(node);
				break;
		}
		this._allForms[prefabPath] = com;

		return com;
	}

	/** 添加到screen中 */
	private async enterToScreen(fid: string, params: any) {
		// 关闭其他显示的窗口 
		let arr: Array<Promise<boolean>> = [];
		for (let key in this._showingForms) {
			arr.push(this._showingForms[key].closeSelf());
		}
		await Promise.all(arr);

		let com = this._allForms[fid];
		if (!com) return;
		this._showingForms[fid] = com;

		await com._preInit(params);
		com.onShow(params);

		await this.showEffect(com);
		com.onAfterShow(params);
	}

	/** 添加到Fixed中 */
	private async enterToFixed(fid: string, params: any) {
		let com = this._allForms[fid];
		if (!com) return;
		await com._preInit(params);

		com.onShow(params);
		this._showingForms[fid] = com;
		await this.showEffect(com);
		com.onAfterShow(params);
	}

	/** 添加到popup中 */
	private async enterToPopup(fid: string, params: any) {
		let com = this._allForms[fid] as UIWindow;
		if (!com) return;
		await com._preInit(params);

		this._windows.push(com);

		for (let i = 0; i < this._windows.length; i++) {
			if (this._windows[i].node) {
				this._windows[i].node.zIndex = i + 1;
			}
		}

		com.onShow(params);
		com.node.getComponent(cc.Widget)?.updateAlignment();
		this._showingForms[fid] = com;

		ModalMgr.inst.checkModalWindow(this._windows);
		await this.showEffect(com);
		com.onAfterShow(params);
	}

	/** 加载到tips中 */
	private async enterToTips(fid: string, params: any) {
		let com = this._allForms[fid];
		if (!com) return;
		await com._preInit(params);

		com.onShow(params);
		await this.showEffect(com);
		com.onAfterShow(params);
	}

	private async enterToToast(fid: string, params: any) {
		let com = this._allForms[fid];
		if (!com) return;
		await com._preInit(params);

		com.onShow(params);
		await this.showEffect(com);
		com.onAfterShow(params);
	}

	private async exitToScreen(fid: string) {
		let com = this._showingForms[fid];
		if (!com) return;
		com.onHide();
		await this.hideEffect(com);
		com.onAfterHide();

		this._showingForms[fid] = null;
		delete this._showingForms[fid];
	}

	private async exitToFixed(fid: string) {
		let com = this._allForms[fid];
		if (!com) return;
		com.onHide();
		await this.hideEffect(com);
		com.onAfterHide();

		this._showingForms[fid] = null;
		delete this._showingForms[fid];
	}

	private async exitToPopup(fid: string) {
		if (this._windows.length <= 0) return;
		let com: UIWindow = null;
		for (let i = this._windows.length - 1; i >= 0; i--) {
			if (this._windows[i].fid === fid) {
				com = this._windows[i];
				this._windows.splice(i, 1);
			}
		}
		if (!com) return;

		com.onHide();
		await this.hideEffect(com);
		com.onAfterHide();
		ModalMgr.inst.checkModalWindow(this._windows);
		this._showingForms[fid] = null;
		delete this._showingForms[fid];
	}

	private async exitToTips(fid: string) {
		let com = this._allForms[fid];
		if (!com) return;
		com.onHide();
		await this.hideEffect(com);
		com.onAfterHide();

		this._showingForms[fid] = null;
		delete this._showingForms[fid];
	}

	private async exitToToast(fid: string) {
		let com = this._allForms[fid];
		if (!com) return;
		com.onHide();
		await this.hideEffect(com);
		com.onAfterHide();

		this._showingForms[fid] = null;
		delete this._showingForms[fid];
	}

	private async showEffect(baseUI: UIBase) {
		baseUI.node.active = true;
		await baseUI.showEffect();
	}

	private async hideEffect(baseUI: UIBase) {
		await baseUI.hideEffect();
		baseUI.node.active = false;
	}

	/** 销毁 */
	private destoryForm(com: UIBase) {
		// 销毁prefab以及依赖的资源
		// ResMgr.inst.destoryFormPrefab(com.fid);
		// 销毁node
		com.node.destroy();
		// 从allmap中删除
		this._allForms[com.fid] = null;
		delete this._allForms[com.fid];
	}


	/** 窗体是否正在显示, 保证这个弹窗只会存在一个弹窗 */
	public checkFormShowing(fid: string) {
		let com = this._allForms[fid];

		if (!cc.isValid(com, true)) {
			return false;
		}
		// if (com.formType === FormType.Toast) {
		// 	return false;
		// }
		return com.node.active;
	}

	/** 窗体是否正在加载 */
	public checkFormLoading(prefabPath: string) {
		let com = this._loadingForm[prefabPath];
		return !!com;
	}

	/** 获得Component */
	public getForm(fId: string) {
		return this._allForms[fId];
	}

	public getUIROOT() {
		return this._UIROOT;
	}
}

if (CC_DEBUG) {
	window['UIManager'] = UIManager;
}