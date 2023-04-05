import { SysDefine, IFormConfig, IFormData } from "./UIDefine";
import TipsMgr from "./TipsMgr";
import UIManager from "./UIManager";

const TAG = "ScreenMgr";
const ShowLoading = false;
class ScreenMgr {
    private _screen: Array<string> = [];
    private _currScreen: string = "";

    public getCurrLayer () {
        return UIManager.getInstance().getForm(this._currScreen);
    }

    /** 打开一个层 */
    public async open (scenePath: string, params?: any, formData?: IFormData) {
        if (this._currScreen == scenePath) {
            cc.warn(TAG, '当前层和需要打开的是同一个:' + scenePath);
            return null;
        }

        await this.openLoading(formData?.loadingForm, params, formData);
        if (this._screen.length > 0) {
            let currScene = this._screen[this._screen.length - 1];
            UIManager.getInstance().closeForm(currScene);
        }

        let idx = this._screen.indexOf(scenePath);
        if (idx == -1) {
            this._screen.push(scenePath);
        } else {
            this._screen.length = idx + 1;
        }

        this._currScreen = scenePath;

        let com = await UIManager.getInstance().openForm(scenePath, params, formData);
        await this.closeLoading(formData?.loadingForm);
        return com;
    }

    /** 回退到上一个层 */
    public async back (params?: any, formData?: IFormData) {
        if (this._screen.length <= 1) {
            cc.warn(TAG, "已经是最后一个了, 无处可退");
            return;
        }
        await this.openLoading(formData?.loadingForm, params, formData);
        let currScene = this._screen.pop();
        await UIManager.getInstance().closeForm(currScene);

        this._currScreen = this._screen[this._screen.length - 1];
        await UIManager.getInstance().openForm(this._currScreen, params, formData);
        await this.closeLoading(formData?.loadingForm);
    }

    public async close (scenePath: string) {
        let com = UIManager.getInstance().getForm(scenePath);
        if (com) {
            if (this._currScreen == scenePath) {
                this._currScreen = '';
            }
            return UIManager.getInstance().closeForm(scenePath);
        }
    }

    private async openLoading (formConfig: IFormConfig, params: any, formData: IFormData) {
        if (!ShowLoading) return;
        let form = formConfig || SysDefine.defaultLoadingForm;
        if (!form) return;
        await TipsMgr.open(form.prefabUrl, params, formData);
    }

    private async closeLoading (formConfig: IFormConfig) {
        if (!ShowLoading) return;
        let form = formConfig || SysDefine.defaultLoadingForm;
        if (!form) return;
        await TipsMgr.close(form.prefabUrl);
    }
}

export default new ScreenMgr();