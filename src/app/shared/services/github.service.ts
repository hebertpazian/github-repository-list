import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions } from '@angular/http';
import { Router } from '@angular/router';

import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '@environment';

import { Repository } from '@app-models/repository.model';

import * as VanillaToasts from 'vanillatoasts';

@Injectable({
    providedIn: 'root'
})
export class GithubService {
    private token: string;
    private isSignedIn: boolean;
    public readonly signStatusObservable = new Subject<boolean>();

    constructor(private router: Router, private http: Http) {
        this.signStatusObservable.subscribe((status: boolean) => (this.isSignedIn = status));
        this.token = localStorage.getItem('token');
        this.signStatusObservable.next(this.token ? true : false);
    }

    getSignedStatus() {
        return this.isSignedIn;
    }

    getRepositoryList(): Observable<Array<Repository>> {
        return this.http.get(`/api.github.com/user/repos?sort=created`, this.getAuthenticatedHeaders()).pipe(map((res) => res.json()));
    }

    signIn(code: string) {
        this.requestToken(code)
            .pipe(map((res) => res.json()))
            .subscribe(
                (data) => {
                    this.token = data.access_token;
                    localStorage.setItem('token', this.token);
                    this.signStatusObservable.next(true);
                    this.router.navigate(['meus-repositorios']);
                },
                () => {
                    VanillaToasts.create({
                        title: 'Erro!',
                        text: `Não foi possivel acessar seu repositório, tente novamente mais tarde.`,
                        type: 'error',
                        timeout: 3500
                    });
                }
            );
    }

    singOut() {
        localStorage.removeItem('token');
        this.signStatusObservable.next(false);
        this.router.navigate(['autenticacao']);
    }

    private requestToken(code: string) {
        return this.http.post(
            '/github.com/login/oauth/access_token',
            {
                client_id: environment.CLIENT_ID,
                client_secret: environment.CLIENT_SECRET,
                code: code
            },
            this.getHeaders()
        );
    }

    private getHeaders(): RequestOptions {
        const headers: Headers = new Headers();
        headers.set('Accept', 'application/json');
        return new RequestOptions({ headers: headers });
    }
    private getAuthenticatedHeaders(): RequestOptions {
        const headers: Headers = new Headers();
        headers.set('Accept', 'application/json');
        headers.set('Authorization', `Bearer ${this.token}`);
        return new RequestOptions({ headers: headers, withCredentials: true });
    }
}
