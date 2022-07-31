import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ConsultaComponent } from './consulta/consulta.component';
import { FormsModule } from '@angular/forms';
import { OrderByPipe } from './pipes/order-by/order-by-pipe';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { LoaderService } from './services/loader.service';
import { InterceptorService } from './services/interceptor.service';

@NgModule({
  declarations: [
    AppComponent,
    ConsultaComponent,
    OrderByPipe,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    LeafletModule,
    CdkAccordionModule,
  ],
  providers: [
    LoaderService,
     { provide: HTTP_INTERCEPTORS,
       useClass: InterceptorService,
       multi: true
     }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
