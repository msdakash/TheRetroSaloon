import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaloonHomePage } from './saloon-home-page';

describe('SaloonHomePage', () => {
  let component: SaloonHomePage;
  let fixture: ComponentFixture<SaloonHomePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaloonHomePage],
    }).compileComponents();

    fixture = TestBed.createComponent(SaloonHomePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
