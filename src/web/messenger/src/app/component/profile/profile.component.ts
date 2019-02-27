import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';

import * as moment from 'moment';
import {FILE_URL} from '../../../../globals';
import {User} from '../../dto/User';
import {UserInfo} from '../../dto/UserInfo';
import {MaritalStatus} from '../../dto/enum/MaritalStatus';

@Component({
	selector: 'app-profile',
	templateUrl: './profile.component.html',
	styleUrls: [
		'./profile.component.scss',
		'./../messaging/messaging.component.search.scss'
	]
})
export class ProfileComponent implements OnInit {

	readonly FILE_URL = FILE_URL;

	@Input() currentProfile;

	@Input() me: User;

	@Output() closeProfile = new EventEmitter();

	@Output() editProfile = new EventEmitter<UserInfo>();

	@ViewChild('fileInput') fileInput;

	unloadedAvatar = {
		path: null
	};

	maritalStatuses = Object.keys(MaritalStatus).filter(key => typeof MaritalStatus[key] === 'number');

	editable = false;

	editView = false;

	date = {
		days: Array.from({length: 31}, (x, i) => i + 1),
		months: Array.from({length: 12}, (x, i) => i + 1),
		years: Array.from({length: 100}, (x, i) => moment().year() - i),
	};

	selectedDate = {
		day: null,
		month: null,
		year: null
	};

	constructor() {
	}

	ngOnInit() {
		this.editable = this.me.login === this.currentProfile.user.login;

		if (this.currentProfile.userInfo.birthDate) {
			const dme = this.dme(this.currentProfile.userInfo.birthDate);

			this.selectedDate.year = dme[0];
			this.selectedDate.month = dme[1];
			this.selectedDate.day = dme[2];
		}
	}

	close() {
		this.unloadedAvatar.path = null;
		this.closeProfile.emit();
	}

	edit() {
		this.currentProfile.userInfo.maritalStatus = this.currentProfile.userInfo.maritalStatus !== 'null' ?
			this.currentProfile.userInfo.maritalStatus : null;
		if (this.selectedDate.day && this.selectedDate.month && this.selectedDate.year) {
			this.currentProfile.userInfo.birthDate = moment([
				parseInt(this.selectedDate.year, 10),
				// TODO: investigate month number shifting
				parseInt(this.monthNumber(this.selectedDate.month), 10) - 2,
				parseInt(this.selectedDate.day, 10)
			]).format('YYYY-MM-DD');
		} else {
			this.currentProfile.userInfo.birthDate = null;
		}
		if (this.fileInput.nativeElement.files[0]) {
			this.currentProfile.userInfo.newAvatar = this.fileInput.nativeElement.files[0];
		}
		this.editProfile.emit(this.currentProfile.userInfo);
		this.editView = false;
	}

	monthName(n: number) {
		return moment().month(n - 1).format('MMMM');
	}

	monthNumber(monthName: string) {
		return moment().month(monthName).format('M');
	}

	dme(date) {
		const d = moment(date).toArray().slice(0, 3);
		d[1] = d[1] + 1;
		return d;
	}

	selectAvatar() {
		this.fileInput.nativeElement.click();
	}

	onAvatarSelect() {
		const reader = new FileReader();
		reader.onload = (e: any) => {
			this.unloadedAvatar.path = e.target.result;
		};
		reader.readAsDataURL(this.fileInput.nativeElement.files[0]);
	}

}
