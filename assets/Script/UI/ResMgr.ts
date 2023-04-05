/**
 * 资源加载, 针对的是Form
 * 首先将资源分为两类
 * 一种是在编辑器时将其拖上去图片, 这里将其称为静态图片, 
 * 一种是在代码中使用cc.loader加载的图片, 这里将其称为动态图片
 * 
 * 对于静态资源
 * 1, 加载  在加载prefab时, cocos会将其依赖的图片一并加载, 所有不需要我们担心
 * 2, 释放  这里采用的资源的动态引用的管理方法, 只需要调用destoryForm即可
 * 
 * 加载一个窗体
 * 第一步 加载prefab, 第二步 实例化prefab 获得 node
 * 所以销毁一个窗体 也需要两步, 销毁node, 销毁prefab
 */
import Utils from "../../Utils";
import CocosHelper from "./CocosHelper";
export default class ResMgr {
	private isShowLog = CC_DEV && false;
	private static instance: ResMgr = null;
	public static get inst () {
		if (this.instance === null) {
			this.instance = new ResMgr();
		}
		return this.instance;
	}

	private _prefabs: { [key: string]: cc.Prefab } = cc.js.createMap();               // 预制体缓存
	private dev: cc.Node = null;

	/** 加载窗体 */
	public async loadFormPrefab (fid: string) {
		if (this._prefabs[fid]) return this._prefabs[fid];
		let res = await CocosHelper.loadResSync<cc.Prefab>(fid, cc.Prefab);
		this._prefabs[fid] = res;
		this._prefabs[fid].addRef();
		this.showLogInfo();

		return res;
	}

	/** 销毁窗体 */
	public destoryFormPrefab (fid: string) {
		if (this._prefabs[fid]) {
			this._prefabs[fid].decRef();
			this._prefabs[fid] = null;
			delete this._prefabs[fid];
		}
		this.showLogInfo();
	}

	/** 检查是否是builtin内的资源 */
	private _checkIsBuiltinAssets (url: string) {
		let asset = cc.assetManager.assets.get(url);
		if (asset && asset['_name'].indexOf("builtin") != -1) {
			return true;
		}
		return false;
	}

	/** 计算当前纹理数量和缓存 */
	public computeTextureCache () {
		let cache = cc.assetManager.assets;
		let totalTextureSize = 0;
		let count = 0;
		cache.forEach((item: cc.Asset, key: string) => {
			let type = (item && item['__classname__']) ? item['__classname__'] : '';
			if (type == 'cc.Texture2D') {
				let texture = item as cc.Texture2D;
				let textureSize = texture.width * texture.height * ((texture['_native'] === '.jpg' ? 3 : 4) / 1024 / 1024);
				// debugger
				totalTextureSize += textureSize;
				count++;
			}
		});
		return `缓存 [纹理总数:${count}][纹理缓存:${totalTextureSize.toFixed(2) + 'M'}]`;
	}

	/** 显示当前资源数量和缓存 */
	public showLogInfo () {
		if (this.isShowLog) {
			assetsMaxNum = cc.assetManager.assets.count > assetsMaxNum ? cc.assetManager.assets.count : assetsMaxNum;
			if (!this.dev) {
				this.dev = new cc.Node('Dev');
				this.dev.setAnchorPoint(0, 0.5);
				this.dev.addComponent(cc.Label);
				this.dev.getComponent(cc.Label).fontSize = 20;
				this.dev.getComponent(cc.Label).enableBold = true;
				this.dev.color = cc.Color.RED;
				let widget = this.dev.addComponent(cc.Widget);
				widget.bottom = 0;
				widget.left = 0;
				widget.updateAlignment();
				cc.director.getScene().addChild(this.dev);
				this.dev.group = 'Windows';
			}
			Utils.setNodeLabel(this.dev, '', `最大缓存数量:${assetsMaxNum},当前:${cc.assetManager.assets.count}`);
			console.log(cc.assetManager.assets.has(xfireol.avatar));

			cc.assetManager.assets.forEach((item: cc.Asset, key: string) => {
				console.log('name:', item.name, '引用数量:', item.refCount);
			})
		}
	}
}
let assetsMaxNum = 0;