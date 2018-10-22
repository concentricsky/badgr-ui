import { Injectable, forwardRef, Inject } from "@angular/core";
import {StandaloneEntitySet} from "../../common/model/managed-entity-set";
import {CommonEntityManager} from "../../entity-manager/common-entity-manager.service";
import {ApiExternalTool, ExternalToolLaunchpointName, ApiExternalToolLaunchpoint, ApiExternalToolLaunchInfo} from "../models/externaltools-api.model";
import {ExternalTool} from "../models/externaltools.model";
import {ExternalToolsApiService} from "./externaltools-api.service";
import { Observable } from "rxjs/Observable";
import { SessionService } from 'app/common/services/session.service';

@Injectable()
export class ExternalToolsManager {
	externaltoolsList = new StandaloneEntitySet<ExternalTool, ApiExternalTool>(
		apiModel => new ExternalTool(this.commonEntityManager),
		apiModel => apiModel.slug,
		() => this.externalToolsApiService.listTools()
	);

	constructor(
		public externalToolsApiService: ExternalToolsApiService,
		@Inject(forwardRef(() => CommonEntityManager))
		public commonEntityManager: CommonEntityManager,
		public sessionService: SessionService
	) {
		// Invalidate the external tools list when the logged in status of the user changes
		this.sessionService.loggedin$.subscribe(() => this.externaltoolsList.invalidateList());
	}

	get allExternalTools$(): Observable<ExternalTool[]> {
		return this.externaltoolsList.loaded$.map(l => l.entities);
	}

	getToolLaunchpoints(launchpointName: ExternalToolLaunchpointName): Promise<ApiExternalToolLaunchpoint[]> {
		return this.allExternalTools$.first().toPromise().then(externaltools =>
			externaltools.map(tool => tool.launchpoints[launchpointName] as ApiExternalToolLaunchpoint).filter(Boolean)
		)
	}

	loadedToolLaunchpoints(launchpointName: ExternalToolLaunchpointName): ApiExternalToolLaunchpoint[] {
		return this.externaltoolsList.entities.map(tool => tool.launchpoints[launchpointName] as ApiExternalToolLaunchpoint).filter(Boolean)
	}

	getLaunchInfo(launchpoint: ApiExternalToolLaunchpoint, contextId: string): Promise<ApiExternalToolLaunchInfo> {
		return this.externalToolsApiService.getLaunchToolInfo(launchpoint, contextId);
	}
}
