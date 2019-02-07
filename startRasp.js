// var express = require('express');
// var router = express.Router();
var fs = require('fs');
var mqtt = require('mqtt');

var SerialPort = require('serialport')
var ReadLine = require('@serialport/parser-readline')

var Broker_URL = 'mqtt://192.168.192.23';
var options = {
	clientId: 'MyMQTT',
	port: 1883,
	keepalive : 60
};

const {spawn} = require('child_process')

var mqttclient1
var topicoclient1='soa > Departamento soa > Habitacion principal > Luz Roja'
var topicoclient2='soa > Departamento soa > Cocina > Luz Verde'
var topicotmp = 'soa > Departamento soa > Cocina > Sensor de Temperatura > out'
var mqttAutomaticFunction1
var topicoAutomaticFunction1='automaticFunction'

var port = new SerialPort('/dev/ttyACM0', {baudRate: 9600})
var parser = port.pipe(new ReadLine({delimiter: '\n'}))
port.on('open', function(){
	console.log('Conectado a Arduino')
})

function setearDispClient1(){
	fs.writeFile("/sys/class/gpio/export", "17", function(error,datos){
		if(error){
			console.log('Error en la primera etapa de configuración del dispositivo '+topicoclient1, error);
		}
		else{
			console.log('Primera etapa de configuración del dispositivo '+topicoclient1+' EXITOSA!');
			fs.writeFile("/sys/class/gpio/gpio17/direction", 'out', function(error,datos){
				if(error){
					console.log('Error en la Segunda etapa de configuración del dispositivo '+topicoclient1, error);
				}
				else{
					console.log('Segunda etapa de configuración del dispositivo '+topicoclient1+' EXITOSA!');
				}
			})
		}
	})
}

function setearDispClient2(){
	fs.writeFile("/sys/class/gpio/export", "27", function(error,datos){
		if(error){
			console.log('Error en la primera etapa de configuración del dispositivo '+topicoclient2, error);
		}
		else{
			console.log('Primera etapa de configuración del dispositivo '+topicoclient2+' EXITOSA!');
			fs.writeFile("/sys/class/gpio/gpio27/direction", 'out', function(error,datos){
				if(error){
					console.log('Error en la Segunda etapa de configuración del dispositivo '+topicoclient2, error);
				}
				else{
					console.log('Segunda etapa de configuración del dispositivo '+topicoclient2+' EXITOSA!');
				}
			})
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

		fs.readFile('/sys/class/gpio/gpio27/value',
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
	port.on('data', function (data) {
		mqttclient1.publish(topicotmp, data)
	})
}

var estaPrendidoSimPres = false;
var process;

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
					fs.writeFile('/sys/class/gpio/gpio27/value', parseInt(message.toString()), function(error,datos){
						if(error){
							console.log('ERROR EN LA ESCRITURA DEL NUEVO ESTADO DEL DISPOSITIVO '+topicoclient2);
						}
						else{
							console.log('ESCRITURA DEL NUEVO ESTADO DEL DISPOSITIVO '+topicoclient2+ 'EXITOSA!');
						}
					})
				}
				
				if(topic == topicoAutomaticFunction1){
					
					if(message.toString() == 'on'){
						estaPrendidoSimPres = true;
						process = spawn('python test_sim_pres.py')
					}else{
						if(estaPrendidoSimPres)
							process.kill()
							estaPrendidoSimPres = false;
							process = null;
						}
				}
			});
		});
	});

}

setearDispClient1();
setearDispClient2();
crearClientesMqtt();
publicarMensajes();