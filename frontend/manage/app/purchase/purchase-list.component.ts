import { Component, OnInit }        from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx';

import { Slug }     from 'ng2-slugify';
import * as moment  from 'moment';
import * as saveAs  from 'file-saver';

import { Purchase }          from './purchase';
import { PurchaseService }   from './purchase.service';

declare var Config: any; //  this comes from the autogenerated config.js file

@Component({
    moduleId: module.id,
    selector: 'lcp-purchase-list',
    templateUrl: 'purchase-list.component.html'
})

export class PurchaseListComponent implements OnInit {
    purchases: Purchase[];
    private slug = new Slug('default');

    constructor(private purchaseService: PurchaseService) {
        this.purchases = [];
    }

    refreshPurchases(): void {
        this.purchaseService.list().then(
            purchases => {
                this.purchases = purchases;
            }
        );
    }

    buildLsdDownloadUrl(purchase: Purchase): string {
        return Config.lsd.url + '/licenses/' + purchase.licenseUuid + '/status';
    }

    buildLcplDownloadUrl(purchase: Purchase): string {
        return Config.frontend.url + '/api/v1/purchases/' + purchase.id + '/license';
    }

    buildLicenseDeliveredClass(licenseUuid: string) {
         if (licenseUuid == null) {
            return "danger";
        }

        return "success";
    }

    buildStatusClass(status: string) {
        if (status == "error") {
            return "danger";
        } else if (status == "returned") {
            return "warning"
        }
        return "success";
    }

    formatDate(date: string): string {
        return moment(date).format('YYYY-MM-DD HH:mm');
    }

    ngOnInit(): void {
        this.refreshPurchases();
    }

    onRemove(objId: any): void {
        this.purchaseService.delete(objId).then(
            purchase => {
                this.refreshPurchases();
            }
        );
    }

    onDownload_LSD(purchase: Purchase): void {

        // The URL does not resolve to a content-disposition+filename like "ebook_title.lsd"
        // If this were the case, most web browsers would normally just download the linked file.
        // Instead, with some browsers the file is displayed (the current page context is overwritten)
        let url = this.buildLsdDownloadUrl(purchase);
        
        //document.location.href = url;
        window.open(url, "_blank");
    }

    onDownload_LCPL(purchase: Purchase): void {
        // Wait 5 seconds before refreshing purchases
        let downloadTimer = Observable.timer(5000);
        let downloadSubscriber = downloadTimer.subscribe(
            (t: any) => {
                this.refreshPurchases();
                downloadSubscriber.unsubscribe();
            }
        );

        // The URL resolves to a content-disposition+filename like "ebook_title.lcpl"
        // Most web browsers should normally just download the linked file, not display it.
        let url = this.buildLcplDownloadUrl(purchase);

        //document.location.href = url;
        window.open(url, "_blank");

        /*this.purchaseService.getLicense(String(purchase.id)).then(
            license => {
                let data = new Blob(
                    [license],
                    { type: 'application/vnd.readium.lcp.license.1.0+json;charset=utf-8'

                    //'application/json;charset=utf-8'
                    //
                    // Safari OSX does not work with the above content-types (known bug with saveAs() lib).
                    // Works with below types, but unfortunately filename is "Unknown", or direct webpage render (not download as file)
                    //
                    //'application/octet-stream'
                    //'text/plain;charset=utf-8'
                    });
                this.refreshPurchases();
                saveAs(data, this.slug.slugify(purchase.publication.title)+'.lcpl');
            }
        );*/
    }

    onReturn(purchase: Purchase): void {
        purchase.status = 'to-be-returned';
        this.purchaseService.update(purchase).then(
            purchase => {
                this.refreshPurchases();
            }
        );
    }
 }
