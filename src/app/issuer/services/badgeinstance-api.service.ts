import { Injectable } from "@angular/core";
import { Http, Response } from "@angular/http";
import { BaseHttpApiService } from "../../common/services/base-http-api.service";
import { SessionService } from "../../common/services/session.service";
import { SystemConfigService } from "../../common/services/config.service";
import { IssuerSlug } from "../models/issuer-api.model";
import { BadgeClassSlug } from "../models/badgeclass-api.model";
import { ApiBadgeInstance, ApiBadgeInstanceForCreation, ApiBadgeInstanceForBatchCreation } from "../models/badgeinstance-api.model";
import { MessageService } from "../../common/services/message.service";


@Injectable()
export class BadgeInstanceApiService extends BaseHttpApiService {
	constructor(
		protected loginService: SessionService,
		protected http: Http,
		protected configService: SystemConfigService,
		protected messageService: MessageService
	) {
		super(loginService, http, configService, messageService);
	}

	createBadgeInstance(
		issuerSlug: IssuerSlug,
		badgeSlug: BadgeClassSlug,
		creationInstance: ApiBadgeInstanceForCreation
	): Promise<ApiBadgeInstance> {
		return this.post(`/v1/issuer/issuers/${issuerSlug}/badges/${badgeSlug}/assertions`, creationInstance)
			.then(r => r.json() as ApiBadgeInstance);
	}

	createBadgeInstanceBatched(
		issuerSlug: IssuerSlug,
		badgeSlug: BadgeClassSlug,
		batchCreationInstance: ApiBadgeInstanceForBatchCreation
	): Promise<ApiBadgeInstance[]>{
		return this.post(`/v1/issuer/issuers/${issuerSlug}/badges/${badgeSlug}/batchAssertions`, batchCreationInstance)
			.then(r => r.json());
	}

	listBadgeInstances(issuerSlug: string, badgeSlug: string, query?: string, num: number = 100): Promise<ApiBadgeInstance[]> {
		let url = `/v1/issuer/issuers/${issuerSlug}/badges/${badgeSlug}/assertions?num=${num}`;
		if (query) {
			url += `&recipient=${query}`
		}
		return this.get(url).then(r=>r.json());
	}

	revokeBadgeInstance(
		issuerSlug: string,
		badgeSlug: string,
		badgeInstanceSlug: string,
		revocationReason: string
	): Promise<Response> {
		return this.delete(
			`/v1/issuer/issuers/${issuerSlug}/badges/${badgeSlug}/assertions/${badgeInstanceSlug}`,
			{
				"revocation_reason": revocationReason
			}
		);
	}


}
