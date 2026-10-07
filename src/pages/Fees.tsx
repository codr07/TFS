import { useEffect, useState } from 'react';
import { CircleDollarSign, Home, Users, Video } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Fee = {
  id?: string;
  name: string;
  amount: number;
  description?: string;
  billing_period?: string;
  active?: boolean;
};

type AddOn = {
  id?: string;
  name: string;
  amount: number;
  description?: string;
  billing_period?: string;
};

type Coupon = {
  name: string;
  coupon_code: string;
  discount_type?: 'percentage' | 'amount';
  discount_value?: number;
  maximum_discount_amount?: number;
  minimum_purchase?: number;
  valid_from?: string;
  valid_until?: string;
  coupon_count?: number;
  active?: boolean;
};

const fallbackFees: Fee[] = [
  {
    name: 'Home Visit',
    amount: 1500,
    description: 'Personalized one-to-one guitar or Standard Ukulele instruction at your location.',
  },
  {
    name: 'Home Tuition',
    amount: 1300,
    description: 'One-to-one guitar or Standard Ukulele instruction at the designated learning location.',
  },
  {
    name: 'Online Tuition',
    amount: 900,
    description: 'Structured one-to-one guitar or Standard Ukulele lessons online.',
  },
  {
    name: 'Ukulele (Dotara) Home Tuition',
    amount: 1500,
    description: 'Specialized Dotara Ukulele instruction. Home Tuition only; online classes are not available.',
  },
];

const Fees = () => {
  const [fees, setFees] = useState<Fee[]>(fallbackFees);
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [discounts, setDiscounts] = useState<Coupon[]>([]);

  useEffect(() => {
    void Promise.all([
      supabase.from('fee_plans').select('*').eq('active', true).order('sort_order'),
      supabase.from('add_ons').select('*').eq('active', true).order('sort_order'),
      supabase.from('discounts').select('*').eq('active', true).order('valid_until', { ascending: true }),
    ]).then(([feesResult, addonsResult, discountsResult]) => {
      if (feesResult.data?.length) setFees(feesResult.data as Fee[]);
      if (addonsResult.data) setAddons(addonsResult.data as AddOn[]);
      if (discountsResult.data) setDiscounts(discountsResult.data as Coupon[]);
    });
  }, []);

  const icons = [Home, Users, Video];

  return (
    <div className="animate-fade-in" style={{ paddingTop: '15vh', paddingBottom: '10vh' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        <div className="text-center">
          <h1>Tuition Fees.</h1>
          <p style={{ fontSize: '1.25rem' }}>Straightforward pricing for premium, personalized musical instruction.</p>
        </div>

        <section className="admin-grid-two" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          {fees.map((fee, index) => {
            const Icon = icons[index % icons.length];
            return (
              <article className="glass-panel hover-lift" key={fee.id || fee.name} style={{ padding: '2rem' }}>
                <Icon size={25} color="var(--gold)" />
                <p className="admin-kicker" style={{ marginTop: '1.25rem' }}>SUBSCRIPTION</p>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{fee.name}</h2>
                <strong style={{ display: 'block', color: 'var(--gold)', fontSize: '2.5rem', marginBottom: '1rem' }}>
                  ₹{Number(fee.amount).toLocaleString('en-IN')}{' '}
                  <small style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>/ {fee.billing_period || 'MONTH'}</small>
                </strong>
                <p>{fee.description}</p>
              </article>
            );
          })}
        </section>

        <section className="glass-panel" style={{ padding: '2rem' }}>
          <p style={{ margin: 0 }}>
            All Guitar and Ukulele (Standard) plans follow the same fee structure. Ukulele (Dotara) is ₹1,500/month for Home Tuition only. Online classes are not available for Ukulele (Dotara).
          </p>
        </section>

        <section className="glass-panel" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
            <CircleDollarSign color="var(--gold)" />
            <h2 style={{ fontSize: '2rem', margin: 0 }}>Add-ons</h2>
          </div>
          <div className="booking-list">
            {addons.length ? (
              addons.map((addon) => (
                <div className="booking-row" key={addon.id || addon.name}>
                  <span>
                    <b>{addon.name}</b>
                    <small>{addon.description}</small>
                  </span>
                  <strong>₹{Number(addon.amount).toLocaleString('en-IN')}</strong>
                  <span>/{addon.billing_period || 'monthly'}</span>
                </div>
              ))
            ) : (
              <p>No add-ons currently available.</p>
            )}
          </div>
        </section>

        <section className="glass-panel" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
            <CircleDollarSign color="var(--gold)" />
            <h2 style={{ fontSize: '2rem', margin: 0 }}>Active discounts</h2>
          </div>
          <p>
            Discounts are available based on current promotions and can be used with a valid active coupon during student checkout.
          </p>
          {discounts.length ? (
            <div className="booking-list">
              {discounts.map((discount) => (
                <div className="booking-row" key={discount.coupon_code}>
                  <span>
                    <b>{discount.name}</b>
                    <small>{discount.coupon_code}</small>
                  </span>
                  <span>
                    {discount.discount_type === 'amount'
                      ? `₹${Number(discount.discount_value || 0).toLocaleString('en-IN')} off`
                      : `${Number(discount.discount_value || 0)}% off`}
                  </span>
                  <span>
                    {discount.maximum_discount_amount
                      ? `Upto ₹${Number(discount.maximum_discount_amount).toLocaleString('en-IN')}`
                      : 'No cap'}
                  </span>
                  <span className="booking-badge">
                    {discount.valid_until ? `Valid till ${new Date(discount.valid_until).toLocaleDateString('en-IN')}` : 'No expiry'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>No active coupons available right now.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default Fees;
