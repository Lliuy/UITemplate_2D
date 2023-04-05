cc.game.on(cc.game.EVENT_GAME_INITED, () => {
    for (const key in UIConfig) {
        let constourt = cc.js.getClassByName(key);
        if (constourt) {
            constourt['UIConfig'] = UIConfig[key];
        }
    }
});

export default class UIConfig {
    public static LayerCover = {
        prefabUrl: 'Prefab/Layer/层_封面',
        type: 'UIScreen'
    };
    public static GameMain = {
        prefabUrl: 'Prefab/Layer/层_关卡',
        type: 'UIScreen'
    };
}
