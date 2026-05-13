import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  QueryConstraint, 
  serverTimestamp,
  orderBy,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { OperationType } from '../types';
import { handleFirestoreError } from '../lib/utils';

export function useFirestoreCollection<T>(collectionName: string, constraints: QueryConstraint[] = []) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, collectionName), ...constraints);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as T);
      });
      setData(items);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, collectionName);
      setError(err as Error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(constraints)]);

  return { data, loading, error };
}

export function useFirestoreActions(collectionName: string) {
  const add = async (item: any) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, collectionName);
    }
  };

  const update = async (id: string, item: any) => {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...item,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${collectionName}/${id}`);
    }
  };

  const remove = async (id: string) => {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${id}`);
    }
  };

  const recordTransaction = async (type: 'purchase' | 'sale', transactionData: any) => {
    const batch = writeBatch(db);
    const productRef = doc(db, 'products', transactionData.productId);
    const transactionRef = doc(collection(db, type === 'purchase' ? 'purchases' : 'sales'));
    
    // 1. Ensure stock is updated
    batch.update(productRef, {
      stock: increment(type === 'purchase' ? transactionData.units : -transactionData.units),
      updatedAt: serverTimestamp()
    });

    // 2. Add transaction record
    batch.set(transactionRef, {
      ...transactionData,
      createdAt: serverTimestamp()
    });

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `Transaction Batch: ${type}`);
    }
  };

  return { add, update, remove, recordTransaction };
}
