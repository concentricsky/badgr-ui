import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';


import { WelcomeComponent } from './welcome.component';
import { ExternalToolsApiService } from '../../../../app/externaltools/services/externaltools-api.service';
import { ExternalToolsManager } from '../../../../app/externaltools/services/externaltools-manager.service';
import { AppConfigService } from '../../../common/app-config.service';
import { CommonEntityManager } from '../../../entity-manager/services/common-entity-manager.service';
import { MessageService } from '../../../common/services/message.service';
import { NavigationService } from '../../../common/services/navigation.service';
import { QueryParametersService } from '../../../common/services/query-parameters.service';
import { SessionService } from "../../../common/services/session.service";

describe('WelcomeComponent', () => {
  let component: WelcomeComponent;
  let fixture: ComponentFixture<WelcomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        WelcomeComponent
      ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule        
      ],
      providers: [
        AppConfigService,
        CommonEntityManager,
        ExternalToolsApiService,
        ExternalToolsManager,
        MessageService,
        NavigationService,
        QueryParametersService,
        SessionService        
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WelcomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
