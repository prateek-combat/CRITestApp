import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Integration tests for archival design system CSS utilities
 * These tests verify that the global CSS classes defined in globals.css
 * are properly applied and work together with the design system
 */

describe('Design System CSS Integration', () => {
  describe('Archival card styles', () => {
    it('should apply card-military class', () => {
      const { container } = render(
        <div className="card-military">Card Content</div>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('card-military');
    });

    it('should apply glass-tactical class', () => {
      const { container } = render(
        <div className="glass-tactical">Glass Card</div>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('glass-tactical');
    });

    it('should apply border-gradient-military class', () => {
      const { container } = render(
        <div className="border-gradient-military">Gradient Border</div>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('border-gradient-military');
    });
  });

  describe('Archival shadow utilities', () => {
    it('should apply shadow-tactical-sm', () => {
      const { container } = render(
        <div className="shadow-tactical-sm">Shadow SM</div>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('shadow-tactical-sm');
    });

    it('should apply shadow-tactical', () => {
      const { container } = render(
        <div className="shadow-tactical">Shadow</div>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('shadow-tactical');
    });

    it('should apply shadow-tactical-lg', () => {
      const { container } = render(
        <div className="shadow-tactical-lg">Shadow LG</div>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('shadow-tactical-lg');
    });

    it('should apply shadow-tactical-xl', () => {
      const { container } = render(
        <div className="shadow-tactical-xl">Shadow XL</div>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('shadow-tactical-xl');
    });
  });

  describe('Archival border utilities', () => {
    it('should apply border-tactical class', () => {
      const { container } = render(
        <div className="border-tactical">Border</div>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('border-tactical');
    });
  });

  describe('Archival input utilities', () => {
    it('should apply input-tactical class to input', () => {
      const { container } = render(
        <input className="input-tactical" type="text" />
      );
      const input = container.querySelector('input');
      expect(input).toHaveClass('input-tactical');
    });

    it('should apply input-tactical class to select', () => {
      const { container } = render(
        <select className="input-tactical">
          <option>Option 1</option>
        </select>
      );
      const select = container.querySelector('select');
      expect(select).toHaveClass('input-tactical');
    });

    it('should apply input-tactical class to textarea', () => {
      const { container } = render(<textarea className="input-tactical" />);
      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveClass('input-tactical');
    });
  });

  describe('Archival gradient backgrounds', () => {
    it('should apply bg-gradient-military', () => {
      const { container } = render(
        <div className="bg-gradient-military">Gradient</div>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('bg-gradient-military');
    });

    it('should apply bg-gradient-military-dark', () => {
      const { container } = render(
        <div className="bg-gradient-military-dark">Dark Gradient</div>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('bg-gradient-military-dark');
    });

    it('should apply bg-gradient-accent', () => {
      const { container } = render(
        <div className="bg-gradient-accent">Accent Gradient</div>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('bg-gradient-accent');
    });
  });

  describe('Archival badge utilities', () => {
    it('should apply badge-tactical', () => {
      const { container } = render(
        <span className="badge-tactical">Badge</span>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('badge-tactical');
    });

    it('should apply badge-success with moss theme', () => {
      const { container } = render(
        <span className="badge-success">Success</span>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('badge-success');
    });

    it('should apply badge-warning with copper theme', () => {
      const { container } = render(
        <span className="badge-warning">Warning</span>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('badge-warning');
    });

    it('should apply badge-error', () => {
      const { container } = render(<span className="badge-error">Error</span>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('badge-error');
    });

    it('should apply badge-info', () => {
      const { container } = render(<span className="badge-info">Info</span>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('badge-info');
    });
  });

  describe('Archival divider utilities', () => {
    it('should apply divider-tactical', () => {
      const { container } = render(<hr className="divider-tactical" />);
      const divider = container.querySelector('hr');
      expect(divider).toHaveClass('divider-tactical');
    });

    it('should apply divider-tactical-thick', () => {
      const { container } = render(<hr className="divider-tactical-thick" />);
      const divider = container.querySelector('hr');
      expect(divider).toHaveClass('divider-tactical-thick');
    });
  });

  describe('Archival table utilities', () => {
    it('should apply table-tactical to table wrapper', () => {
      const { container } = render(
        <div className="table-tactical">
          <table>
            <thead>
              <tr>
                <th>Header</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cell</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('table-tactical');
    });
  });

  describe('Archival overlay utilities', () => {
    it('should apply overlay-tactical', () => {
      const { container } = render(
        <div className="overlay-tactical">Overlay</div>
      );
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass('overlay-tactical');
    });
  });

  describe('Archival progress utilities', () => {
    it('should apply progress-tactical', () => {
      const { container } = render(
        <div className="progress-tactical">
          <div className="progress-tactical-bar" style={{ width: '50%' }}></div>
        </div>
      );
      const progress = container.firstChild as HTMLElement;
      expect(progress).toHaveClass('progress-tactical');

      const bar = container.querySelector('.progress-tactical-bar');
      expect(bar).toHaveClass('progress-tactical-bar');
    });
  });

  describe('Combined archival classes', () => {
    it('should work with multiple tactical classes', () => {
      const { container } = render(
        <div className="card-military shadow-tactical-lg border-tactical">
          Combined Classes
        </div>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('card-military');
      expect(element).toHaveClass('shadow-tactical-lg');
      expect(element).toHaveClass('border-tactical');
    });

    it('should work with gradient and shadow classes', () => {
      const { container } = render(
        <div className="bg-gradient-military shadow-tactical">
          Gradient with Shadow
        </div>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('bg-gradient-military');
      expect(element).toHaveClass('shadow-tactical');
    });

    it('should work with glass and border classes', () => {
      const { container } = render(
        <div className="glass-tactical border-gradient-military">
          Glass with Gradient Border
        </div>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('glass-tactical');
      expect(element).toHaveClass('border-gradient-military');
    });
  });

  describe('Archival color token usage', () => {
    it('should apply ink color classes', () => {
      const { container } = render(<div className="text-ink">Ink Text</div>);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('text-ink');
    });

    it('should apply parchment color classes', () => {
      const { container } = render(
        <div className="bg-parchment">Parchment Background</div>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('bg-parchment');
    });

    it('should apply copper color classes', () => {
      const { container } = render(
        <div className="text-copper">Copper Text</div>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('text-copper');
    });

    it('should apply moss color classes', () => {
      const { container } = render(<div className="text-moss">Moss Text</div>);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('text-moss');
    });

    it('should apply slateblue color classes', () => {
      const { container } = render(
        <div className="text-slateblue">Slateblue Text</div>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('text-slateblue');
    });
  });

  describe('Archival opacity modifiers', () => {
    it('should support ink opacity variants', () => {
      const { container } = render(
        <>
          <div className="text-ink/10">10%</div>
          <div className="text-ink/30">30%</div>
          <div className="text-ink/50">50%</div>
          <div className="text-ink/70">70%</div>
          <div className="bg-ink/5">5% bg</div>
        </>
      );

      expect(container.querySelector('.text-ink\\/10')).toBeInTheDocument();
      expect(container.querySelector('.text-ink\\/30')).toBeInTheDocument();
      expect(container.querySelector('.text-ink\\/50')).toBeInTheDocument();
      expect(container.querySelector('.text-ink\\/70')).toBeInTheDocument();
      expect(container.querySelector('.bg-ink\\/5')).toBeInTheDocument();
    });

    it('should support parchment opacity variants', () => {
      const { container } = render(
        <>
          <div className="bg-parchment/80">80%</div>
          <div className="bg-parchment/90">90%</div>
        </>
      );

      expect(container.querySelector('.bg-parchment\\/80')).toBeInTheDocument();
      expect(container.querySelector('.bg-parchment\\/90')).toBeInTheDocument();
    });
  });

  describe('Responsive archival design', () => {
    it('should support responsive spacing classes', () => {
      const { container } = render(
        <div className="p-3 md:p-4 lg:p-6">Responsive Padding</div>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('p-3');
      expect(element).toHaveClass('md:p-4');
      expect(element).toHaveClass('lg:p-6');
    });
  });

  describe('Hover states with archival theme', () => {
    it('should apply hover classes', () => {
      const { container } = render(
        <button className="hover:shadow-tactical-lg hover:bg-ink/5">
          Hover Button
        </button>
      );
      const button = container.querySelector('button');
      expect(button).toHaveClass('hover:bg-ink/5');
      expect(button).toHaveClass('hover:shadow-tactical-lg');
    });
  });

  describe('Focus states with copper ring', () => {
    it('should apply copper focus ring', () => {
      const { container } = render(
        <input className="focus:ring-copper/40" type="text" />
      );
      const input = container.querySelector('input');
      expect(input).toHaveClass('focus:ring-copper/40');
    });
  });

  describe('Transition classes', () => {
    it('should apply transition-all classes', () => {
      const { container } = render(
        <div className="transition-all duration-300">Transition</div>
      );
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('transition-all');
      expect(element).toHaveClass('duration-300');
    });
  });
});
