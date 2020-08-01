import { Component, OnInit, NgZone } from '@angular/core';
import { ToastController, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { BLE } from '@ionic-native/ble/ngx';

// Bluetooth UUIDs
const BLE_SERVICE = "ffe0";
const BLE_CHARACTERISTIC = "ffe1";

@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss']
 
})
export class DetailPage implements OnInit {

  peripheral: any = {};
  statusMessage: string;
 public dataFromDevice: any;
    constructor(public route: ActivatedRoute, public router: Router, private ble: BLE,
        private toastCtrl: ToastController, private alertCtrl: AlertController, private ngZone: NgZone) {

        this.route.queryParams.subscribe(params => {
          if (params && params.special) {
              const device = JSON.parse(params.special);
              this.setStatus('Connecting to ' + device.name || device.id);

              //Call BLE Connect - Connect to BLE Device
              this.BleConnect(device);
    
          }
      });
   }


    ngOnInit() {
  }

    BleConnect(device) {
        this.ble.connect(device.id).subscribe(
            peripheral => this.onConnected(peripheral),
            peripheral => this.onDeviceDisconnected(peripheral)
        );
    }

    BleDisconnect() {
        this.ble.disconnect(this.peripheral.id).then(
            () => console.log('Disconnected ' + JSON.stringify(this.peripheral)),
            () => console.log('ERROR disconnecting ' + JSON.stringify(this.peripheral)));
    }

    BleWrite() {

        // Subscribe for notifications when the resitance changes
        var inputdata = new Uint8Array(3);
        inputdata[0] = 0x53; // S
        inputdata[1] = 0x54; // T
        inputdata[2] = 0x0a; // LF

        this.ble
            .writeWithoutResponse(
                this.peripheral.id,
                BLE_SERVICE,
                BLE_CHARACTERISTIC,
                inputdata.buffer
            )
            .then(
                data => {
                    debugger;   
                    
                    console.log(data);
                    this.subscribe();
                },
                err => {
                    console.log(err);
                }
            );
    }

    subscribe() {
        this.ble
            .startNotification(this.peripheral.id, BLE_SERVICE, BLE_CHARACTERISTIC)
            .subscribe(
                data => {
                    console.log(data);
                    this.onValueChange(data);
                },
                () =>
                    this.showAlert(
                        "Unexpected Error",
                        "Failed to subscribe for changes, please try to re-connect."
                    )
            );
    }

    onValueChange(buffer: ArrayBuffer) {
        this.ngZone.run(() => {
            try {
                if (this.dataFromDevice == undefined) this.dataFromDevice = this.bytesToString(buffer).replace(/\s+/g, " ");
                else this.dataFromDevice += '<br />' + this.bytesToString(buffer).replace(/\s+/g, " ");
            } catch (e) {
                console.log(e);
            }
        });
    }

    bytesToString(buffer) {
        return String.fromCharCode.apply(null, new Uint8Array(buffer));
    }
   
    onConnected(peripheral) {
    this.ngZone.run(() => {
      this.setStatus('');
        this.peripheral = peripheral;
        this.BleWrite();
    });
  }

 async onDeviceDisconnected(peripheral) {
    const toast = await this.toastCtrl.create({
      message: 'The peripheral unexpectedly disconnected',
      duration: 3000,
      position: 'middle'
    });
    toast.present();
  }

  // Disconnect peripheral when leaving the page
  ionViewWillLeave() {
    console.log('ionViewWillLeave disconnecting Bluetooth');
      this.BleDisconnect();
  }

  setStatus(message) {
    console.log(message);
    this.ngZone.run(() => {
      this.statusMessage = message;
    });
  }

    async showAlert(title, message) {
        let alert = await this.alertCtrl.create({
            header: title,
            message: message,
            buttons: ["OK"]
        });
        alert.present();
    }


}
