package com.github.ivanjermakov.lettercore.util;

import org.apache.commons.text.CharacterPredicates;
import org.jetbrains.annotations.NotNull;

public class RandomStringGenerator {

	private static final org.apache.commons.text.RandomStringGenerator randomStringGenerator =
			new org.apache.commons.text.RandomStringGenerator.Builder()
					.withinRange('0', 'z')
					.filteredBy(CharacterPredicates.LETTERS, CharacterPredicates.DIGITS)
					.build();

	@NotNull
	public static String generate(@NotNull Integer length) {
		return randomStringGenerator.generate(length);
	}

}
