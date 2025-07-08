import { ViewModel, observable, computed, command } from '@esengine/mvvm-ui-framework';

/**
 * 用户配置文件视图模型
 */
export class UserProfileViewModel extends ViewModel {
    
    public get name(): string {
        return 'UserProfileViewModel';
    }

    @observable
    avatar: string = '';

    @observable
    nickname: string = '';

    @observable
    email: string = '';

    @observable
    phone: string = '';

    @computed(['nickname', 'email'])
    get displayInfo(): string {
        return `${this.nickname} (${this.email})`;
    }

    @command()
    public updateProfile(): void {
        console.log('更新用户配置文件');
    }
} 