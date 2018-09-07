var exampleaudio = function() {
    this.eplay = function() {
        api.device.playAudio('../../res/music.mp3');
    };
    this.estop = function() {
        api.device.stopPlay();
    };
}
