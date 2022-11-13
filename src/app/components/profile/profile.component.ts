import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
import {TalksPresenter} from '../../shared/classes/talks-presenter';
import {AppUser} from '../../model/appUser';
import {AuthService} from '../../services/auth.service';
import {TopicLinesService} from '../../services/topic-lines.service';
import {Talk} from '../../model/talk';
import {AddTalkComponent} from '../talks-weekend/add-talk/add-talk.component';
import {MatDialog} from '@angular/material/dialog';
import {AngularFirestore} from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent extends TalksPresenter implements OnInit {
  public profileForm: any;
  public savedNotice: boolean = false;
  public registrationClosed = false;

  constructor(private auth: AuthService,
              private dialog: MatDialog,
              afs: AngularFirestore,
              topicLinesService: TopicLinesService,
              private fb: FormBuilder) {
    super(afs, topicLinesService, auth);
  }

  public hasAllObligatoryFields(): boolean {
    return !this.user || this.user?.hasAllObligatoryFields();
  }

  public ngOnInit() {
    this.auth.userData.subscribe((userData: any) => {
      if (userData === null) {
        return;
      }
      this.user = userData;
      this.buildForm();
    });
  }

  public get myOrderedTalks() {
    const myTalks = this.talksView.filter((talk: Talk) => talk.userId === this.user?.id);
    return myTalks.sort((a, b) => {
      if (b.voters.length === a.voters.length) {
        if (b.name > a.name) {
          return -1;
        } else {
          return 1;
        }
      }
      return b.voters.length - a.voters.length;
    });
  }

  public buildForm(): void {
    this.profileForm = this.fb.group({
      name: new FormControl(this.user?.name || this.auth.lastUsedName, [
        Validators.required,
        Validators.minLength(1)]),
      pavecere: [this.user?.pavecere],
      sosnidane: [this.user?.sosnidane],
      sobed: [this.user?.sobed],
      sovecere: [this.user?.sovecere],
      student: [this.user?.student],
      email: new FormControl({value: this.user?.email, disabled: true}, Validators.required),
    });
  }

  public save() {
    if (!this.profileForm.valid) {
      return;
    }
    if (!this.user) {
      return;
    }
    this.user.willAttend = true;
    this.patchUser();
  }

  public cancelRegistration() {
    if (!this.user) {
      return;
    }
    this.user.willAttend = false;
    this.patchUser();
  }

  public patchUser() {
    if (!this.user) {
      return;
    }
    this.user.name = this.profileForm.get('name').value;
    this.user.pavecere = this.profileForm.get('pavecere').value;
    this.user.sosnidane = this.profileForm.get('sosnidane').value;
    this.user.sobed = this.profileForm.get('sobed').value;
    this.user.sovecere = this.profileForm.get('sovecere').value;
    this.user.student = this.profileForm.get('student').value;
    this.user.patch().then((_) => {
      this.savedNotice = true;
      window.setTimeout(() => {
        this.savedNotice = false;
      }, 2000);
    });
  }

  public openAddTalkDialog(): void {
    this.dialog.open(AddTalkComponent, {
      width: '800px',
      data: {user: this.user}
    });
  }
}
