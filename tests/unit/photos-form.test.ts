import fs from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { allChecked, cleanLine, imageUrls, LABELS, normalizePlace, parseIssueForm } from '../../scripts/photos/form';

const body = `### Revir ali lokacija / Section or spot

https://ribolovc.si/sl/revirji/rd-tolmin/soca-3?x=1

### Fotografije / Photos

![IMG_1](https://github.com/user-attachments/assets/0a1b2c3d-1111-2222-3333-444455556666)
<img width="800" alt="x" src="https://github.com/user-attachments/assets/ffff0000-1111-2222-3333-444455556666" />
![evil](https://example.com/a.jpg)

### Opis / Caption

_No response_

### Avtor / Credit

Janez <b>Novak</b>

### Soglasje / Consent

- [X] Fotografijo sem posnel/a sam/a. / I took this photo myself.
- [X] Dovolim objavo pod licenco CC BY 4.0.
- [x] Na fotografiji ni prepoznavnih oseb.`;

describe('photo issue form', () => {
  const form = parseIssueForm(body);

  it('splits the form into fields', () => {
    expect(form[LABELS.caption]).toBe('');
    expect(cleanLine(form[LABELS.author], 80)).toBe('Janez Novak');
  });

  it('accepts page links and ids as the place', () => {
    expect(normalizePlace(form[LABELS.place])).toBe('revir:rd-tolmin/soca-3');
    expect(normalizePlace('https://ribolovc-si.vercel.app/en/spots/bohinj-ukanc/')).toBe('spot:bohinj-ukanc');
    expect(normalizePlace('revir:rd-barje/reka-Ljubljanica-barje')).toBe('revir:rd-barje/reka-Ljubljanica-barje');
    expect(normalizePlace('Soča pri Tolminu')).toBeNull();
  });

  it('only takes images uploaded to GitHub', () => {
    expect(imageUrls(form[LABELS.photos])).toEqual([
      'https://github.com/user-attachments/assets/0a1b2c3d-1111-2222-3333-444455556666',
      'https://github.com/user-attachments/assets/ffff0000-1111-2222-3333-444455556666',
    ]);
  });

  it('requires every consent box', () => {
    expect(allChecked(form[LABELS.consent])).toBe(true);
    expect(allChecked('- [X] a\n- [ ] b')).toBe(false);
    expect(allChecked('')).toBe(false);
  });

  it('uses the same labels as the issue template', () => {
    const template = parse(fs.readFileSync('.github/ISSUE_TEMPLATE/photo.yml', 'utf8')) as {
      body: { id?: string; attributes: { label?: string } }[];
    };
    const labels = template.body.filter((b) => b.id).map((b) => b.attributes.label);
    expect(labels).toEqual(Object.values(LABELS));
  });
});
