import { Injectable } from "@angular/core";
import { Angulartics2 } from "angulartics2";
import {RecipientBadgeApiService} from "../../recipient/services/recipient-badges-api.service";

@Injectable()
export class SharingService {
	constructor(
		private angulartics: Angulartics2,
		private recipientBadgeApiService: RecipientBadgeApiService
	) {}

	shareWithFacebook(
		objectType: SharedObjectType,
		objectIdUrl: string,
		shareUrl: string
	) {
		this.reportShare(objectType, objectIdUrl, "Facebook", shareUrl);

		window.open(
			`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
			"_blank",
			"width=550,height=274"
		);
	}

	shareWithLinkedIn(
		objectType: SharedObjectType,
		objectIdUrl: string,
		shareUrl: string,
		shareTitle: string,
		shareSummary: string,
		shareEndpoint: ShareEndPoint
	) {

		this.reportShare(objectType, objectIdUrl, "LinkedIn", shareUrl);

		const LINKEDIN_CERTIFICATION_ID = '0_Rh2Ig_U-uUIRE_d6IyGdbo9HEb-oOcx3oQEeI3UsCrYgZ6NMdJoZbvNeJ5QKSAKeaSgvthvZk7wTBMS3S-m0L6A6mLjErM6PJiwMkk6nYZylU7__75hCVwJdOTZCAkdv';

		// Default window location is sharing an article
		let windowLocation = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}&summary=${encodeURIComponent(shareSummary)}&source=Badgr`;

		// TODO: Reimplement if LinkedIn ever decide to play nice. - Ethan 4/5/2017
		/*if (shareEndpoint === 'certification'){
			windowLocation = `https://www.linkedin.com/profile/add?_ed=${encodeURIComponent(LINKEDIN_CERTIFICATION_ID)}&pfCertificationName=${encodeURIComponent(shareTitle)}&pfCertificationUrl=${encodeURIComponent(shareUrl)}`;
		}*/

		window.open(
			windowLocation,
			"_blank",
			"width=550,height=448"
		);
	}

	shareWithTwitter(
		objectType: SharedObjectType,
		objectIdUrl: string,
		shareUrl: string
	) {
		this.reportShare(objectType, objectIdUrl, "Twitter", shareUrl);

		window.open(
			`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareUrl)}%20I%20earned%20a%20badge%20via%20Badgr.`,
			"_blank",
			"width=550,height=274"
		);
	}

	shareWithPinterest(
		objectType: SharedObjectType,
		objectIdUrl: string,
		shareUrl: string,
		imageUrl: string,
		summary?: string
	) {
		this.reportShare(objectType, objectIdUrl, "Pinterest", shareUrl);
		
		window.open(
			`http://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(summary)}`,
			"_blank"
		);
	}

	private reportShare(
		objectType: SharedObjectType,
		objectIdUrl: string,
		serviceType: ShareServiceType,
		sharedUrl: string
	) {
		this.angulartics.eventTrack.next({
			action: `${objectType}-share`,
			properties: {
				category: `shares-${serviceType.toLowerCase()}`,
				label: "Share of " + objectIdUrl + " to " + serviceType
			}
		});
		if (objectType == "BadgeInstance") {
			this.recipientBadgeApiService.getBadgeShareUrlForProvider(objectIdUrl, serviceType);
		} else
		if (objectType == "BadgeCollection") {
			this.recipientBadgeApiService.getCollectionShareUrlForProvider(objectIdUrl, serviceType);
		}
	}
}

export type SharedObjectType = "BadgeInstance" | "BadgeCollection";
export type ShareServiceType = "Facebook" | "LinkedIn" | "Twitter" | "Pinterest";
export type ShareEndPoint = "shareArticle" | "certification";