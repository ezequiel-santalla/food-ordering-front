import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoungePage } from './lounge-page';

describe('LoungePage', () => {
  let component: LoungePage;
  let fixture: ComponentFixture<LoungePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoungePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoungePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
