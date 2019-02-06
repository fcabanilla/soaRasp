import RPi.GPIO as GPIO
import time
import random

import signal
import sys
import time


GPIO.setmode(GPIO.BCM)
GPIO.setup(17, GPIO.OUT) ## GPIO 17 como salida
GPIO.setup(27, GPIO.OUT) ## GPIO 27 como salida

def cleanup(*args):
    print "clean me"


    for disp in lista_dispositivos:
        GPIO.output(disp, True)

    GPIO.cleanup()
    sys.exit(0)


def check_presencia(tiempos, dispositivos):
    menor = min((x[1], idx) for idx, x in enumerate(tiempos))

    print(lista_de_tiempos)

    tiempo_de_encendido = menor[0]
    indice_de_dispositivo = menor[1]

    time.sleep(tiempo_de_encendido)
    GPIO.output(dispositivos[indice_de_dispositivo], False)
    del(tiempos[indice_de_dispositivo])
    del(dispositivos[indice_de_dispositivo])

    if not tiempos:
        return

    for i in range(len(tiempos)):
        tiempos[i][1]-=tiempo_de_encendido

    check_presencia(tiempos, dispositivos)


signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

while(True):


    lista_dispositivos = [17,27]

    lista_de_tiempos = [[k, random.randint(0, 9)] for k in range(1,3)]

    espera = random.randint(0,4)
    print("Tiempo de espera: " + str(espera))
    time.sleep(espera)

    for disp in lista_dispositivos:
        GPIO.output(disp, True)

    check_presencia(lista_de_tiempos, lista_dispositivos)
