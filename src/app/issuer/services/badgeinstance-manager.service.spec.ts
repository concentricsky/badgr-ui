import { TestBed, inject } from "@angular/core/testing";
import { BadgeInstanceManager } from "./badgeinstance-manager.service";
import { MockBackend } from "@angular/http/testing";
import {
	randomIssuerName,
	testSlugForName,
	randomBadgeName,
	randomEmail,
	randomUuid,
	randomNames
} from "../../common/util/test/test-data-util";
import { ApiBadgeInstance, ApiBadgeInstanceJsonld } from "../models/badgeinstance-api.model";
import { testIssuerRefForSlug } from "./issuer-manager.service.spec";
import { testBadgeClassRefForSlugs } from "./badgeclass-manager.service.spec";
import { expectRequestAndRespondWith } from "../../common/util/mock-response-util";
import { BaseRequestOptions, Http, RequestMethod } from "@angular/http";
import { BadgeInstance } from "../models/badgeinstance.model";
import { verifyManagedEntitySet } from "../../common/model/managed-entity-set.spec";
import { SystemConfigService } from "../../common/services/config.service";
import { SessionService } from "../../common/services/session.service";
import { CommonEntityManager } from "../../entity-manager/common-entity-manager.service";
import { BadgeInstanceApiService } from "./badgeinstance-api.service";
import { MessageService } from "../../common/services/message.service";

describe('BadgeInstanceManager', () => {
	const defaultIssuerSlug = testSlugForName(randomIssuerName());

	beforeEach(() => TestBed.configureTestingModule({
		declarations: [  ],
		providers: [
			SystemConfigService,
			MockBackend,
			BaseRequestOptions,
			MessageService,
			{ provide: 'config', useValue: { api: { baseUrl: '' }, features: {} } },
			{
				provide: Http,
				useFactory: (backend, options) => new Http(backend, options),
				deps: [ MockBackend, BaseRequestOptions ]
			},

			SessionService,
			CommonEntityManager,
			BadgeInstanceApiService,
			BadgeInstanceManager,
		],
		imports: [ ]
	}));

	beforeEach(inject([ SessionService ], (loginService: SessionService) => {
		loginService.storeToken({ token: "MOCKTOKEN" });
	}));


	it('should load instances for a badge class',
		inject(
			[ BadgeInstanceManager, MockBackend ],
			(badgeInstanceManager: BadgeInstanceManager, mockBackend: MockBackend) => {
				const badgeClassSlug = testSlugForName(randomBadgeName());
				const apiInstances = randomNames(3, randomUuid).map(slug =>
					generateTestBadgeInstance({
						issuerSlug: defaultIssuerSlug,
						badgeClassSlug: badgeClassSlug,
						badgeInstanceSlug: slug
					})
				);

				return Promise.all([
					expectBadgeInstanceListRequest(mockBackend, defaultIssuerSlug, badgeClassSlug, apiInstances),
					badgeInstanceManager.instancesForBadgeClass(defaultIssuerSlug, badgeClassSlug)
						.then(list => {
							verifyManagedEntitySet(list, apiInstances, verifyBadgeInstance)
						})
				]);

			}
		)
	);

	it('should handle issuing new badge',
		inject(
			[ BadgeInstanceManager, SessionService, MockBackend ],
			(badgeInstanceManager: BadgeInstanceManager, loginService: SessionService, mockBackend: MockBackend) => {
				const badgeClassSlug = testSlugForName(randomBadgeName());
				const email = randomEmail();
				const newApiInstance = generateTestBadgeInstance({
					issuerSlug: defaultIssuerSlug,
					badgeClassSlug: badgeClassSlug,
					recipientIdentifier: email,
				});

				return Promise.all([
					expectBadgeInstanceListRequest(mockBackend, defaultIssuerSlug, badgeClassSlug, []),
					expectRequestAndRespondWith(
						mockBackend,
						RequestMethod.Post,
						`/v1/issuer/issuers/${defaultIssuerSlug}/badges/${badgeClassSlug}/assertions`,
						newApiInstance
					),
					badgeInstanceManager.createBadgeInstance(
						defaultIssuerSlug,
						badgeClassSlug,
						{
							issuer: defaultIssuerSlug,
							badge_class: badgeClassSlug,
							recipient_type: "email",
							recipient_identifier: email
						}
					).then(instance => {
						verifyBadgeInstance(instance, newApiInstance)
					})

				]);
			}
		)
	);

	it('should handle revoking badge',
		inject(
			[ BadgeInstanceManager, SessionService, MockBackend ],
			(badgeInstanceManager: BadgeInstanceManager, loginService: SessionService, mockBackend: MockBackend) => {
				const badgeClassSlug = testSlugForName(randomBadgeName());
				const apiInstances = randomNames(2, randomUuid).map(slug =>
					generateTestBadgeInstance({
						issuerSlug: defaultIssuerSlug,
						badgeClassSlug: badgeClassSlug,
						badgeInstanceSlug: slug
					})
				);

				return Promise.all([
					expectBadgeInstanceListRequest(mockBackend, defaultIssuerSlug, badgeClassSlug, apiInstances),
					badgeInstanceManager.instancesForBadgeClass(defaultIssuerSlug, badgeClassSlug)
						.then(list => {
							const instanceToRevoke = list.entityForApiEntity(apiInstances[ 0 ]);

							return Promise.all([
								expectRequestAndRespondWith(
									mockBackend,
									RequestMethod.Delete,
									`/v1/issuer/issuers/${list.issuerSlug}/badges/${list.badgeClassSlug}/assertions/${instanceToRevoke.slug}`,
									"success"
								),
								instanceToRevoke.revokeBadgeInstance("BadgeInstanceManager Testing Revoke").then(() => {
									verifyManagedEntitySet(list, [ apiInstances[ 1 ] ], verifyBadgeInstance)
								})

							]);
						})
				]);
			}
		)
	);
});


function expectBadgeInstanceListRequest(
	mockBackend: MockBackend,
	issuerSlug: string,
	badgeClassSlug: string,
	instances: ApiBadgeInstance[]
) {
	return expectRequestAndRespondWith(
		mockBackend,
		RequestMethod.Get,
		`/v1/issuer/issuers/${issuerSlug}/badges/${badgeClassSlug}/assertions?num=100`,
		instances
	)
}

export function verifyBadgeInstance(
	instance: BadgeInstance,
	apiInstance: ApiBadgeInstance = instance.apiModel
) {
	expect(instance.url).toEqual(apiInstance.json.id);
	expect(instance.slug).toEqual(apiInstance.slug);
	expect(instance.slug).toEqual(apiInstance.json.uid);
}

/*
 *
 */

function generateTestBadgeInstance(
	{
		issuerSlug = testSlugForName(randomIssuerName()),
		badgeClassSlug = testSlugForName(randomBadgeName()),
		badgeInstanceSlug = randomUuid(),
		recipientIdentifier = randomEmail()
	}
): ApiBadgeInstance {
	return <ApiBadgeInstance>{
		"slug": badgeInstanceSlug,
		"image": "",
		"recipient_identifier": recipientIdentifier,
		"revoked": false,
		"issuer": testIssuerRefForSlug(issuerSlug)[ "@id" ],
		"badge_class": testBadgeClassRefForSlugs(issuerSlug, badgeClassSlug)[ "@id" ],
		"created_at": "2015-09-18T17:47:47Z",
		"json": <ApiBadgeInstanceJsonld>{
			"type": "Assertion",
			"id": testBadgeInstanceRefForSlugs(issuerSlug, badgeClassSlug, badgeInstanceSlug)[ "@id" ],
			"uid": badgeInstanceSlug,
		},
	};
}


export function testBadgeInstanceRefForSlugs(issuerSlug: string, badgeClassSlug: string, badgeInstanceSlug: string) {
	return {
		"@id": `http://localhost:8000/public/assertions/${badgeInstanceSlug}`,
		"slug": badgeInstanceSlug,
		"issuer": testIssuerRefForSlug(issuerSlug),
		"badge_class": testBadgeClassRefForSlugs(issuerSlug, badgeClassSlug),
	};
}
