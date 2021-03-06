import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Member } from '../_models/member';
import { PaginatedResult } from '../_models/pagination';
import { User } from '../_models/user';
import { UserParams } from '../_models/userParams';
import { AccountService } from './account.service';
import { getPaginationHeaders, getPaginationResult } from './paginationHelper';

@Injectable({
	providedIn: 'root',
})
export class MembersService {
	baseUrl = environment.apiUrl;
	members: Member[] = [];
	memberCache = new Map();
	user: User;
	userParams: UserParams;

	constructor(
		private http: HttpClient,
		private accountService: AccountService
	) {
		this.accountService.currentUser$.pipe(take(1)).subscribe((user) => {
			this.user = user;
			this.userParams = new UserParams(user);
		});
	}

	getUserParams() {
		return this.userParams;
	}

	setUserParams(userParams: UserParams) {
		this.userParams = userParams;
	}

	resetUserParams() {
		this.userParams = new UserParams(this.user);
		return this.userParams;
	}

	getMembers(userParams: UserParams) {
		// Try to find query key words from cache
		var response = this.memberCache.get(
			Object.values(userParams).join('-')
		);
		if (response) {
			return of(response);
		}

		let params = getPaginationHeaders(
			userParams.PageNumber,
			userParams.pageSize
		);

		params = params.append('minAge', userParams.minAge.toString());
		params = params.append('maxAge', userParams.maxAge.toString());
		params = params.append('gender', userParams.gender);
		params = params.append('orderBy', userParams.orderBy);

		return getPaginationResult<Member[]>(
			this.baseUrl + 'users',
			params,
			this.http
		).pipe(
			map((response) => {
				// Set the cache
				this.memberCache.set(
					Object.values(userParams).join('-'),
					response
				);
				return response;
			})
		);
	}

	getMember(username: string) {
		// Get values from cache
		const member = [...this.memberCache.values()]
			.reduce((arr, elem) => arr.concat(elem.result), [])
			.find((member: Member) => member.username === username);

		if (member) {
			return of(member);
		}

		return this.http.get<Member>(this.baseUrl + 'users/' + username);
	}

	updateMember(member: Member) {
		return this.http.put(this.baseUrl + 'users', member).pipe(
			map(() => {
				const index = this.members.indexOf(member);
				this.members[index] = member;
			})
		);
	}

	// Send http request
	setMainPhoto(photoId: number) {
		return this.http.put(
			this.baseUrl + 'users/set-main-photo/' + photoId,
			{}
		);
	}

	deletePhoto(photoId: number) {
		return this.http.delete(this.baseUrl + 'users/delete-photo/' + photoId);
	}

	// Add like
	addLike(username: string) {
		return this.http.post(this.baseUrl + 'likes/' + username, {});
	}

	getLikes(predicate: string, pageNumber, pageSize) {
		let params = getPaginationHeaders(pageNumber, pageSize);
		params = params.append('predicate', predicate);
		return getPaginationResult<Partial<Member[]>>(
			this.baseUrl + 'likes',
			params,
			this.http
		);
	}
}
