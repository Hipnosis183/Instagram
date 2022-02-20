import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'page-user',
  templateUrl: './page-user.component.html',
  styleUrls: ['./page-user.component.css']
})

export class PageUserComponent implements OnInit {

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    public router: Router,
    private title: Title
  ) {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  userName: any = '';
  userNotFound: boolean = false;
  userPosts: any[] = [];
  userProfile: any = null;

  private profileError() {
    this.title.setTitle('Page not found · Instagular');
    this.userNotFound = true; return of();
    return throwError(() => new Error('Profile error: cannot load user profile information.'));
  }

  loadProfile(): void {
    this.http.post<any>('/api/profile', { id: this.route.snapshot.paramMap.get('id'), session: localStorage.getItem("state") })
      .pipe(catchError(this.profileError.bind(this)))
      .subscribe((data: any) => {
        console.info('Profile loaded successfully!');
        console.log(data);
        this.userProfile = data;
        this.title.setTitle(`${data.full_name ? data.full_name : data.username} (@${data.username})`);
        if (!data.is_private || (data.is_private && data.friendship.following)) {
          this.loadUser();
        }
      });
  }

  private userError() {
    return throwError(() => new Error('User error: cannot load user media.'));
  }

  loadUser(): void {
    this.http.post<object[]>('/api/user', { feed: localStorage.getItem("feed"), id: this.route.snapshot.paramMap.get('id'), session: localStorage.getItem("state") })
      .pipe(catchError(this.userError))
      .subscribe((data: any) => {
        console.info('User loaded successfully!');
        console.log(data);
        localStorage.setItem('feed', data.feed);
        this.userPosts = this.userPosts.concat(data.posts);
      });
  }

  private followError() {
    return throwError(() => new Error('Following error: could not follow user.'));
  }

  followUser(): void {
    this.http.post('/api/follow', { userId: this.userProfile.pk, session: localStorage.getItem("state") })
      .pipe(catchError(this.followError))
      .subscribe((data) => {
        console.info('User followed successfully!');
        this.userProfile.friendship.following = true;
      });
  }

  private unfollowError() {
    return throwError(() => new Error('Unfollowing error: could not unfollow user.'));
  }

  unfollowUser(): void {
    this.http.post('/api/unfollow', { userId: this.userProfile.pk, session: localStorage.getItem("state") })
      .pipe(catchError(this.unfollowError))
      .subscribe((data) => {
        console.info('User unfollowed successfully :(');
        this.userProfile.friendship.following = false;
      });
  }

  listIndex: number = 0;
  listTitle: string = '';
  usersList: any[] = [];

  private followersError() {
    return throwError(() => new Error('Followers error: cannot load followers information.'));
  }

  loadFollowers(): void {
    this.http.post<object[]>('/api/followers', { feed: localStorage.getItem("follow"), id: this.route.snapshot.paramMap.get('id'), session: localStorage.getItem("state") })
      .pipe(catchError(this.followersError))
      .subscribe((data: any) => {
        console.info('Followers loaded successfully!');
        console.log(data);
        localStorage.setItem('follow', data.feed);
        this.listIndex = 0;
        this.listTitle = 'Followers';
        this.usersList = this.usersList.concat(data.followers);
      });
  }

  private followingError() {
    return throwError(() => new Error('Following error: cannot load following information.'));
  }

  loadFollowing(): void {
    this.http.post<object[]>('/api/following', { feed: localStorage.getItem("follow"), id: this.route.snapshot.paramMap.get('id'), session: localStorage.getItem("state") })
      .pipe(catchError(this.followingError))
      .subscribe((data: any) => {
        console.info('Following loaded successfully!');
        console.log(data);
        localStorage.setItem('follow', data.feed);
        this.listIndex = 1;
        this.listTitle = 'Following';
        this.usersList = this.usersList.concat(data.following);
      });
  }

  loadUserPage(username: string): void {
    localStorage.removeItem('follow');
    this.router.navigate(['/' + username]);
  }

  closeUsers(): void {
    this.usersList = [];
    localStorage.removeItem('follow');
  }

  ngOnInit(): void {
    this.userName = localStorage.getItem('user');
    localStorage.removeItem('feed');
    localStorage.removeItem('follow');
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.title.setTitle('Instagular');
  }
}
