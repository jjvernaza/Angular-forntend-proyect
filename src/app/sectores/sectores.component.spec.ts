import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SectoresComponent } from './sectores.component';
import { SectorService } from '../services/sector.service';

describe('SectoresComponent', () => {
  let component: SectoresComponent;
  let fixture: ComponentFixture<SectoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectoresComponent, HttpClientTestingModule], // ← IMPORTS
      providers: [SectorService]
    }).compileComponents();

    fixture = TestBed.createComponent(SectoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});