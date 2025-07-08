import { ViewModel, observable, computed, command } from '@esengine/mvvm-ui-framework';

/**
 * 商店视图模型
 */
export class ShopViewModel extends ViewModel {
    
    public get name(): string {
        return 'ShopViewModel';
    }

    @observable
    selectedCategory: string = 'weapons';

    @observable
    playerGold: number = 1000;

    @observable
    cartItems: any[] = [];

    @computed(['cartItems'])
    get totalPrice(): number {
        return this.cartItems.reduce((total, item) => total + item.price, 0);
    }

    @computed(['playerGold', 'totalPrice'])
    get canPurchase(): boolean {
        return this.playerGold >= this.totalPrice;
    }

    @command()
    public addToCart(item: any): void {
        this.cartItems.push(item);
    }

    @command('canPurchase')
    public purchase(): void {
        this.playerGold -= this.totalPrice;
        this.cartItems = [];
    }
} 