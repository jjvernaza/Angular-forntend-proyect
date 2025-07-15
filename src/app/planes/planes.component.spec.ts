import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PlanesComponent } from './planes.component';
import { PlanService } from '../services/plan.service';
import { ApiService } from '../services/api.service';

describe('PlanesComponent', () => {
  let component: PlanesComponent;
  let fixture: ComponentFixture<PlanesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanesComponent, HttpClientTestingModule], // ← IMPORTS
      providers: [PlanService, ApiService]
    }).compileComponents();

    fixture = TestBed.createComponent(PlanesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});