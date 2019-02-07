// var express = require('express');
// var router = express.Router();
var fs = require('fs');
var mqtt = require('mqtt');

var SerialPort = require('serialport')
var ReadLine = require('@serialport/parser-readline')

//var Broker_URL = 'mqtt://localhost';
var Broker_URL = 'mqtt://192.168.192.24';
var options = {
	clientId: 'MyMQTT',
	port: 1883,
	keepalive : 60
};

var mqttclient1
var topicoclient1='colo > Casa del colo > Banio principal > telefono'
var mqttclient2
var topicoclient2='colo > Casa del colo > Banio principal > inodoro inteligente'
var mqttAutomaticFunction1
var topicoAutomaticFunction1='automaticFunction > 1'
var mqttAutomaticFunction2
var topicoAutomaticFunction2='automaticFunction > 2'


// function mqtt_connect1() {
// 	mqttclient1.subscribe(topicoclient1, mqtt_subscribe1);
// };
// function mqtt_subscribe1(err, granted) {
// 	if (err) {return console.log(err);}
// 	console.log(granted)
//     console.log("Subscribed to " + topicoclient1);
// };
//
// function mqtt_connect2() {
// 	mqttclient2.subscribe(topicoclient2, mqtt_subscribe2);
// };
// function mqtt_subscribe2(err, granted) {
// 	if (err) {return console.log(err);}
// 	console.log(granted)
//     console.log("Subscribed to " + topicoclient2);
// };

var port = new SerialPort('/dev/ttyACM0', {baudRate: 9600})
var parser = port.pipe(new ReadLine({delimiter: '\n'}))
port.on('open', function(){
	console.log('Conectado a Arduino')
})

port.on('data', function(data){
	console.log(data)
})


function setearDispClient1(){
	fs.writeFile("/sys/class/gpio/export", "17", function(error,datos){
		if(error){
			console.log('Error en la primera etapa de configuración del dispositivo '+topicoclient1, error);
		}
		else{
			console.log('Primera etapa de configuración del dispositivo '+topicoclient1+' EXITOSA!');
		}
	})
	fs.writeFile("/sys/class/gpio/gpio17/direction", 'out', function(error,datos){
		if(error){
			console.log('Error en la Segunda etapa de configuración del dispositivo '+topicoclient1, error);
		}
		else{
			console.log('Segunda etapa de configuración del dispositivo '+topicoclient1+' EXITOSA!');
		}
	})
}

function setearDispClient2(){
	fs.writeFile("/sys/class/gpio/export", "23", function(error,datos){
		if(error){
			console.log('Error en la primera etapa de configuración del dispositivo '+topicoclient2);
		}
		else{
			console.log('Primera etapa de configuración del dispositivo '+topicoclient2+' EXITOSA!');
		}
	})
	fs.writeFile("/sys/class/gpio/gpio23/direction", 'out', function(error,datos){
		if(error){
			console.log('Error en la Segunda etapa de configuración del dispositivo '+topicoclient2);
		}
		else{
			console.log('Segunda etapa de configuración del dispositivo '+topicoclient2+' EXITOSA!');
		}
	})
}


function publicarMensajes(){
    setInterval(function(){
		fs.readFile('/sys/class/gpio/gpio17/value',
			function(error, datos) {
				if(error){
					console.log('hubo un error')
				} else{
					console.log('ok')
					topic = topicoclient1 + ' > out';
					console.log({topic1: topic});
					mqttclient1.publish(topic, datos.toString().replace(/\r?\n/g, ""));
				}
			}
		);

		fs.readFile('/sys/class/gpio/gpio23/value',
			function(error, datos) {
				if(error){
					console.log('hubo un error')
				} else{
					console.log('ok')
					topic = topicoclient2 + ' > out';
					console.log({topic2: topic});
					mqttclient1.publish(topic , datos.toString().replace(/\r?\n/g, ""))
				}
			}
		);

    },10000,"JavaScript");
}

function crearClientesMqtt(){
	mqttclient1=mqtt.connect(Broker_URL, options);
	mqttclient1.on('connect', function(){
		mqttclient1.subscribe([topicoclient1, topicoclient2], function(){
			mqttclient1.on('message', function(topic, message, packet){

				console.log(topic, packet)

				if(topic == topicoclient1)
					fs.writeFile('/sys/class/gpio/gpio17/value', parseInt(message.toString()), function(error,datos){
						if(error){
							console.log('ERROR EN LA ESCRITURA DEL NUEVO ESTADO DEL DISPOSITIVO '+topicoclient1);
						}
						else{
							console.log('ESCRITURA DEL NUEVO ESTADO DEL DISPOSITIVO '+topicoclient1+ 'EXITOSA!');
						}
					})
				if(topic == topicoclient2){
					fs.writeFile('/sys/class/gpio/gpio23/value', parseInt(message.toString()), function(error,datos){
						if(error){
							console.log('ERROR EN LA ESCRITURA DEL NUEVO ESTADO DEL DISPOSITIVO '+topicoclient2);
						}
						else{
							console.log('ESCRITURA DEL NUEVO ESTADO DEL DISPOSITIVO '+topicoclient2+ 'EXITOSA!');
						}
					})
				}
				if(topic == topicoAutomaticFunction1){
					// EJECUTAR SCRIPT FUNCION AUTOMATICA 1
					// SCRIPT EN PYTHON
				}
				if(topic == topicoAutomaticFunction2){
					// EJECUTAR SCRIPT FUNCION AUTOMATICA 2

					/*SERA ACA VA LA FUNCION DEL SENSOR DE MOVIMIENTO*/
				}

			});
		});
	});

}

setearDispClient1();
setearDispClient2();
crearClientesMqtt();
// console.log('pase por aca');
publicarMensajes();


// module.exports = router;
