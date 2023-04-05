/*******************************************************************************
文件: ModalMgr.ts
创建: 2022年06月15日
作者: 
描述:
    遮罩管理
*******************************************************************************/

import { ModalType, SysDefine } from './UIDefine';
import { UIWindow } from './UIBase';
import UIModalScript from './UIModalScript';

const { ccclass, property } = cc._decorator;

@ccclass
export default class ModalMgr extends cc.Component {
    public static get inst () {
        if (this._inst == null) {
            this._inst = new ModalMgr();
            let node = new cc.Node('UIModalNode');
            ModalMgr.popUpRoot = SysDefine.SYS_UIROOT_NAME + '/' + SysDefine.SYS_POPUP_NODE;
            console.log(ModalMgr.popUpRoot);
            
            let rootNode = cc.find(ModalMgr.popUpRoot);
            rootNode.addChild(node);
            this._inst.uiModal = node.addComponent(UIModalScript);
            this._inst.uiModal.init();
        }
        return this._inst;
    }
    public static popUpRoot = '';
    public static _inst: ModalMgr = null;

    private uiModal: UIModalScript = null;

    public checkModalWindow (coms: UIWindow[]) {
        if (coms.length <= 0) {
            this.uiModal.node.active = false;
            return;
        }
        this.uiModal.node.active = true;
        if (this.uiModal.node.parent) {
            this.uiModal.node.removeFromParent();
        }
        for (let i = coms.length - 1; i >= 0; i--) {
            if (coms[i].modalType.opacity > 0) {
                cc.find(ModalMgr.popUpRoot).addChild(this.uiModal.node, Math.max(coms[i].node.zIndex - 1, 0));
                this.uiModal.fid = coms[i].fid;
                this.showModal(coms[i].modalType);
                break;
            }
        }
    }

    /** 为mask添加颜色 */
    private async showModal (maskType: ModalType) {
        await this.uiModal.showModal(maskType.opacity, maskType.easingTime, maskType.isEasing);
    }
}

