const mongoose = require('mongoose');
const moment = require('moment');

async function connectDatabase(){
    try{
        await mongoose.connect('mongodb://localhost:27017/an_ninh_gia_dinh');
        console.log('connect database');
    }
    catch(ex){
        console.log('error connecting database');
    }

}

function ArduinoDeviceState() {
    this.create = function(){
        var arduino_device_state_schema = new mongoose.Schema({
            buttonState: String,
            buzzerState: String,
            motionSensorState: String,
            time : { type : String, default: moment().format("YYYY-MM-DD HH:mm:ss") }
        },{
            timestamps: false,
        });
    
        return  mongoose.model('arduino_device_state', arduino_device_state_schema);
    }
}

ArduinoDeviceStateModel = new ArduinoDeviceState().create();

async function addDatabase({buttonState, buzzerState, motionSensorState}){
    const arduinoDeviceState = new ArduinoDeviceStateModel({
        buttonState,
        buzzerState,
        motionSensorState
    });

    arduinoDeviceState.save().then(()=>{
        console.log('Thêm Dữ Liệu Thành Công');
    })
    .catch(()=>{
        console.log('Thêm Dữ Liệu Thất Bại');
    });
}

function closeDatabase(){
    mongoose.connection.close();
}

module.exports = {
    connectDatabase,
    addDatabase,
    closeDatabase
};